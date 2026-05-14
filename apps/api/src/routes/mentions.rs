use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::user::Plan;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct MentionScanRequest {
    pub domain: String,
    pub brand_name: String,
}

#[derive(Debug, Deserialize)]
pub struct MentionListParams {
    pub source: Option<String>,
    pub sentiment: Option<String>,
    pub limit: Option<i64>,
}

/// POST /api/v1/mentions/scan — Trigger mention scan (Pro only)
pub async fn scan_mentions(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<MentionScanRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Brand mention monitoring requires Pro plan.".into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();
    let brand_name = req.brand_name.trim().to_string();

    if domain.is_empty() || brand_name.is_empty() {
        return Err(AppError::BadRequest(
            "Domain and brand name are required".into(),
        ));
    }

    // Publish to NATS
    let nats_payload = json!({
        "user_id": auth_user.id,
        "domain": domain,
        "brand_name": brand_name,
    });

    state
        .nats
        .publish("geo.mention.scan", nats_payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish mention scan: {}", e)))?;
    let _ = state.nats.flush().await;

    Ok(Json(json!({
        "status": "scanning",
        "message": "Brand mention scan started. Results will appear shortly.",
    })))
}

/// GET /api/v1/mentions — List brand mentions
pub async fn list_mentions(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<MentionListParams>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Brand mention monitoring requires Pro plan.".into(),
        ));
    }

    let limit = params.limit.unwrap_or(50).min(200);
    let mentions = db::list_brand_mentions(
        &state.db,
        auth_user.id,
        params.source.as_deref(),
        params.sentiment.as_deref(),
        limit,
    )
    .await?;

    Ok(Json(json!({ "mentions": mentions })))
}

/// GET /api/v1/mentions/summary — Mention stats
pub async fn mention_summary(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Brand mention monitoring requires Pro plan.".into(),
        ));
    }

    let summary = db::get_mention_summary(&state.db, auth_user.id).await?;

    Ok(Json(json!({ "summary": summary })))
}
