use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct StartAuditRequest {
    pub domain: String,
    pub scope: Option<serde_json::Value>,
    pub rate_limit: Option<String>,
}

/// POST /attack-surface — Start an attack surface audit for a verified domain (Pro only)
pub async fn start_audit(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<StartAuditRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let monthly_limit = plan.attack_surface_per_month();
    if monthly_limit >= 0 {
        let used = db::count_user_attack_surface_this_month(&state.db, auth_user.id).await?;
        if used >= monthly_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} attack surface audit(s) this month. Upgrade to Pro for unlimited.",
                monthly_limit
            )));
        }
    }

    let domain = req.domain.trim().to_lowercase();
    let scope = req.scope.unwrap_or(serde_json::json!({}));
    let rate_limit = req.rate_limit.unwrap_or_else(|| "moderate".to_string());

    // Validate rate_limit
    if !["conservative", "moderate", "aggressive"].contains(&rate_limit.as_str()) {
        return Err(AppError::BadRequest(
            "rate_limit must be conservative, moderate, or aggressive".into(),
        ));
    }

    // Verify the user owns this domain
    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden(
                "Domain must be verified before auditing. Use POST /domains/verify first.".into(),
            )
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Check for existing in-progress audit on this domain
    let existing = db::get_user_attack_surface_audits(&state.db, auth_user.id).await?;
    if let Some(running) = existing
        .iter()
        .find(|a| a.domain == domain && a.status == "running")
    {
        return Ok(Json(serde_json::json!({
            "audit": running,
            "message": "An audit is already in progress for this domain"
        })));
    }

    // Max 3 concurrent audits per user
    let running_count = existing.iter().filter(|a| a.status == "running").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent audits allowed. Wait for one to complete.".into(),
        ));
    }

    // Create audit record
    let audit = db::create_attack_surface_audit(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        &scope,
        &rate_limit,
    )
    .await?;

    // Publish audit request to NATS for the worker
    let payload = serde_json::json!({
        "audit_id": audit.id,
        "domain": domain,
        "scope": scope,
        "rate_limit": rate_limit,
    });

    state
        .nats
        .publish(
            "attacksurface.request",
            payload.to_string().into(),
        )
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish audit request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(
        audit_id = %audit.id,
        domain = %domain,
        "Published attack surface audit request"
    );

    Ok(Json(serde_json::json!({
        "audit": audit,
        "message": "Attack surface audit started. Poll GET /attack-surface/{id} for progress."
    })))
}

/// GET /attack-surface/{id} — Get audit status and results
pub async fn get_audit(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let audit = db::get_attack_surface_audit(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Audit not found".into()))?;

    if audit.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your audit".into()));
    }

    Ok(Json(serde_json::json!({
        "audit": audit
    })))
}

/// GET /attack-surface — List user's audits
pub async fn list_audits(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let audits = db::get_user_attack_surface_audits(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "audits": audits
    })))
}

/// POST /attack-surface/{id}/pair — Link an attack surface audit with a deep scan (full audit)
pub async fn pair_audit(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<PairAuditRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let audit = db::get_attack_surface_audit(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Audit not found".into()))?;

    if audit.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your audit".into()));
    }

    let deep_scan = db::get_deep_scan(&state.db, req.deep_scan_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Deep scan not found".into()))?;

    if deep_scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your deep scan".into()));
    }

    db::pair_full_audit(&state.db, id, req.deep_scan_id).await?;

    Ok(Json(serde_json::json!({
        "message": "Full audit paired successfully",
        "audit_id": id,
        "deep_scan_id": req.deep_scan_id
    })))
}

#[derive(Debug, Deserialize)]
pub struct PairAuditRequest {
    pub deep_scan_id: Uuid,
}

/// POST /attack-surface/{id}/cancel — Cancel an in-progress audit
pub async fn cancel_audit(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let audit = db::get_attack_surface_audit(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Audit not found".into()))?;

    if audit.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your audit".into()));
    }

    if audit.status != "running" && audit.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending audits can be cancelled".into(),
        ));
    }

    db::update_attack_surface_status(&state.db, id, "cancelled").await?;

    // Notify the worker to stop (best-effort — worker may not subscribe to cancels yet)
    let payload = serde_json::json!({ "audit_id": id });
    if let Err(e) = state
        .nats
        .publish(
            format!("attacksurface.cancel.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(audit_id = %id, error = %e, "Failed to publish attack surface cancel");
    }

    Ok(Json(serde_json::json!({
        "message": "Audit cancelled"
    })))
}
