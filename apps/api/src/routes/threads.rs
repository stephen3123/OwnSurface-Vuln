use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::user::Plan;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct ThreadDiscoverRequest {
    pub domain: String,
    pub brand_name: String,
    pub industry: Option<String>,
    pub keywords: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct ThreadListParams {
    pub platform: Option<String>,
    pub status: Option<String>,
    pub thread_type: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ThreadDraftRequest {
    pub thread_title: String,
    pub brand_name: String,
    pub brand_description: String,
}

#[derive(Debug, Deserialize)]
pub struct ThreadStatusUpdate {
    pub status: String,
}

/// POST /api/v1/threads/discover — Find thread opportunities (Pro only)
pub async fn discover_threads(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<ThreadDiscoverRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Thread discovery requires Pro plan.".into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();
    let brand_name = req.brand_name.trim().to_string();

    if domain.is_empty() || brand_name.is_empty() {
        return Err(AppError::BadRequest(
            "Domain and brand name are required".into(),
        ));
    }

    let keywords = req.keywords.unwrap_or_default();

    let nats_payload = json!({
        "user_id": auth_user.id,
        "domain": domain,
        "brand_name": brand_name,
        "industry": req.industry,
        "keywords": keywords,
    });

    state
        .nats
        .publish("geo.thread.discover", nats_payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish thread discovery: {}", e)))?;
    let _ = state.nats.flush().await;

    Ok(Json(json!({
        "status": "discovering",
        "message": "Thread discovery started. Results will appear shortly.",
    })))
}

/// GET /api/v1/threads — List discovered threads
pub async fn list_threads(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<ThreadListParams>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Thread discovery requires Pro plan.".into(),
        ));
    }

    let limit = params.limit.unwrap_or(50).min(200);
    let threads = db::list_thread_opportunities(
        &state.db,
        auth_user.id,
        params.platform.as_deref(),
        params.status.as_deref(),
        params.thread_type.as_deref(),
        limit,
    )
    .await?;

    Ok(Json(json!({ "threads": threads })))
}

/// GET /api/v1/threads/{id} — Thread detail
pub async fn get_thread(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Thread discovery requires Pro plan.".into(),
        ));
    }

    let thread = db::get_thread_opportunity(&state.db, id, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("Thread not found".into()))?;

    Ok(Json(json!({ "thread": thread })))
}

/// POST /api/v1/threads/{id}/draft — Generate reply draft
pub async fn draft_reply(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(req): Json<ThreadDraftRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_ai_visibility() {
        return Err(AppError::Forbidden(
            "Reply drafting requires Pro plan.".into(),
        ));
    }

    let thread = db::get_thread_opportunity(&state.db, id, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("Thread not found".into()))?;

    // Use NATS request/reply to get draft from worker
    let nats_payload = json!({
        "type": "draft",
        "thread_id": id,
        "thread_url": thread.thread_url,
        "thread_title": req.thread_title,
        "brand_name": req.brand_name,
        "brand_description": req.brand_description,
    });

    let response = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        state.nats.request("geo.thread.discover", nats_payload.to_string().into()),
    )
    .await
    .map_err(|_| AppError::Queue("Reply draft generation timed out".into()))?
    .map_err(|e| AppError::Queue(format!("Failed to get reply draft: {}", e)))?;

    let draft_result: serde_json::Value =
        serde_json::from_slice(&response.payload).unwrap_or(json!({"draft": ""}));

    Ok(Json(json!({
        "thread_id": id,
        "draft": draft_result.get("draft").and_then(|d| d.as_str()).unwrap_or(""),
    })))
}

/// PUT /api/v1/threads/{id}/status — Update thread status
pub async fn update_thread_status(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(req): Json<ThreadStatusUpdate>,
) -> AppResult<Json<serde_json::Value>> {
    let valid_statuses = ["new", "saved", "replied", "dismissed"];
    if !valid_statuses.contains(&req.status.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid status. Must be one of: {}",
            valid_statuses.join(", ")
        )));
    }

    db::update_thread_status(&state.db, id, auth_user.id, &req.status).await?;

    Ok(Json(json!({
        "id": id,
        "status": req.status,
    })))
}
