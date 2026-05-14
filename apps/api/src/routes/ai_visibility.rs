use axum::{extract::State, Extension, Json};
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::lead::AiVisibilityRequest;
use crate::models::user::Plan;
use crate::services::db;
use crate::state::AppState;

/// POST /api/v1/ai-visibility — Start a visibility check (Pro only)
pub async fn start_check(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<AiVisibilityRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "AI visibility tracking requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();
    let brand_name = req.brand_name.trim().to_string();

    if domain.is_empty() || brand_name.is_empty() {
        return Err(AppError::BadRequest(
            "Domain and brand name are required".into(),
        ));
    }

    // Validate domain format (basic check)
    if domain.len() > 253 || !domain.contains('.') {
        return Err(AppError::BadRequest(
            "Invalid domain format".into(),
        ));
    }

    // Validate brand name: max 100 chars, no control characters
    if brand_name.len() > 100 {
        return Err(AppError::BadRequest(
            "Brand name must be 100 characters or fewer".into(),
        ));
    }
    if brand_name.chars().any(|c| c.is_control()) {
        return Err(AppError::BadRequest(
            "Brand name contains invalid characters".into(),
        ));
    }

    // Check monthly limit
    let monthly_checks =
        db::count_user_ai_visibility_this_month(&state.db, auth_user.id).await?;
    let limit = plan.ai_visibility_checks_per_month();
    if limit >= 0 && monthly_checks >= limit as i64 {
        return Err(AppError::TooManyRequests(format!(
            "Monthly AI visibility check limit reached ({}/{})",
            monthly_checks, limit
        )));
    }

    // Check 7-day cooldown per domain
    let recent = db::get_recent_ai_visibility_check(&state.db, &domain, auth_user.id).await?;
    if recent.is_some() {
        return Err(AppError::TooManyRequests(
            "This domain was checked within the last 7 days. Please wait before re-checking."
                .into(),
        ));
    }

    // Get industry from domain_profiles if available
    let industry = if let Some(profile) = db::get_domain_profile(&state.db, &domain).await? {
        profile.industry
    } else {
        None
    };

    let check = db::create_ai_visibility_check(
        &state.db,
        &domain,
        auth_user.id,
        &brand_name,
        industry.as_deref(),
    )
    .await?;

    // Publish to NATS for the GEO worker to process
    let nats_payload = json!({
        "check_id": check.id,
        "domain": domain,
        "brand_name": brand_name,
        "industry": industry,
    });
    if let Err(e) = state
        .nats
        .publish("geo.ai-visibility.check", nats_payload.to_string().into())
        .await
    {
        tracing::error!(error = %e, "Failed to publish AI visibility check to NATS");
    }
    let _ = state.nats.flush().await;

    Ok(Json(json!({
        "id": check.id,
        "domain": check.domain,
        "brand_name": check.brand_name,
        "status": check.status,
        "created_at": check.created_at,
    })))
}

/// GET /api/v1/ai-visibility — List user's checks
pub async fn list_checks(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "AI visibility tracking requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let checks = db::list_ai_visibility_checks(&state.db, auth_user.id).await?;
    Ok(Json(json!({ "checks": checks })))
}

/// GET /api/v1/ai-visibility/{id} — Get detailed results
pub async fn get_check(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "AI visibility tracking requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let check = db::get_ai_visibility_check(&state.db, id, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("AI visibility check not found".into()))?;

    let results = db::get_ai_visibility_results(&state.db, id).await?;
    let citations = db::get_ai_visibility_citations(&state.db, id).await?;
    let sov = db::get_share_of_voice(&state.db, &check.domain, auth_user.id).await?;

    Ok(Json(json!({
        "check": check,
        "results": results,
        "citations": citations,
        "share_of_voice": sov,
    })))
}
