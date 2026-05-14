use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

fn default_api_spec_scope() -> serde_json::Value {
    serde_json::json!({
        "auth_bypass_testing": true,
        "jwt_testing": true,
        "ssrf_testing": true,
        "idor_testing": true,
        "rate_limit_testing": true,
        "graphql_testing": true,
        "api_fuzzing": true,
        "content_type_manipulation": true
    })
}

fn detect_spec_format(spec_content: &str) -> &'static str {
    let trimmed = spec_content.trim_start();
    if trimmed.starts_with('{') {
        if trimmed.contains("\"swagger\"") {
            "swagger"
        } else if trimmed.contains("\"openapi\":\"3")
            || trimmed.contains("\"openapi\": \"3")
        {
            "openapi3"
        } else {
            "openapi3"
        }
    } else if spec_content.contains("\nswagger:") || spec_content.trim_start().starts_with("swagger:") {
        "swagger"
    } else {
        "openapi3"
    }
}

#[derive(Debug, Deserialize)]
pub struct StartApiSpecScanRequest {
    pub domain: String,
    pub spec: String,
    pub scope: Option<serde_json::Value>,
    pub rate_limit: Option<String>,
}

/// POST /api-spec-scan — Start an API spec security scan for a verified domain (Pro only)
pub async fn start_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<StartApiSpecScanRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let monthly_limit = plan.offensive_scans_per_month();
    if monthly_limit == 0 {
        return Err(AppError::Forbidden(
            "API spec scanning requires a Pro plan. Upgrade at https://ownsurface.com/dashboard/billing".into(),
        ));
    } else if monthly_limit > 0 {
        let used = db::count_user_api_spec_scans_this_month(&state.db, auth_user.id).await?;
        if used >= monthly_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} offensive scan(s) this month.",
                monthly_limit
            )));
        }
    }
    // monthly_limit == -1 means unlimited (Pro), skip check

    let domain = req.domain.trim().to_lowercase();
    let scope = req.scope.unwrap_or_else(default_api_spec_scope);
    let rate_limit = req.rate_limit.unwrap_or_else(|| "moderate".to_string());

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
                "Domain must be verified before API spec scanning. Use POST /domains/verify first.".into(),
            )
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Check for existing in-progress scan on this domain
    let existing = db::get_user_api_spec_scans(&state.db, auth_user.id).await?;
    if let Some(running) = existing
        .iter()
        .find(|s| s.domain == domain && s.status == "running")
    {
        return Ok(Json(serde_json::json!({
            "scan": running,
            "message": "An API spec scan is already in progress for this domain"
        })));
    }

    // Max 3 concurrent scans per user
    let running_count = existing.iter().filter(|s| s.status == "running").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent API spec scans allowed. Wait for one to complete.".into(),
        ));
    }

    // Resolve spec content: if it starts with "http", fetch it; otherwise treat as raw content
    let spec_content = if req.spec.trim().starts_with("http") {
        let url = req.spec.trim().to_string();
        let resp = reqwest::get(&url)
            .await
            .map_err(|e| AppError::BadRequest(format!("Failed to fetch spec from URL: {}", e)))?;
        if !resp.status().is_success() {
            return Err(AppError::BadRequest(format!(
                "Failed to fetch spec from URL: HTTP {}",
                resp.status()
            )));
        }
        resp.text()
            .await
            .map_err(|e| AppError::BadRequest(format!("Failed to read spec response body: {}", e)))?
    } else {
        req.spec.clone()
    };

    // Detect spec format (JSON vs YAML)
    let spec_format = detect_spec_format(&spec_content);

    // Create scan record
    let scan = db::create_api_spec_scan(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        spec_format,
        &scope,
        &rate_limit,
    )
    .await?;

    // Publish scan request to NATS for the worker
    let payload = serde_json::json!({
        "scan_id": scan.id,
        "user_id": auth_user.id,
        "domain": domain,
        "spec_content": spec_content,
        "scope": scope,
        "rate_limit": rate_limit,
    });

    state
        .nats
        .publish(
            "apispec.request",
            payload.to_string().into(),
        )
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish API spec scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(
        scan_id = %scan.id,
        domain = %domain,
        "Published API spec scan request"
    );

    Ok(Json(serde_json::json!({
        "scan": scan,
        "message": "API spec scan started. Poll GET /api-spec-scan/{id} for progress."
    })))
}

/// GET /api-spec-scan/{id} — Get scan status and results
pub async fn get_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_api_spec_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("API spec scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    Ok(Json(serde_json::json!({
        "scan": scan
    })))
}

/// GET /api-spec-scan — List user's API spec scans
pub async fn list_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_api_spec_scans(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "scans": scans
    })))
}

/// POST /api-spec-scan/{id}/cancel — Cancel an in-progress scan
pub async fn cancel_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_api_spec_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("API spec scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    db::update_api_spec_scan_status(&state.db, id, "cancelled").await?;

    let payload = serde_json::json!({ "scan_id": id });
    if let Err(e) = state
        .nats
        .publish(
            format!("apispec.cancel.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(scan_id = %id, error = %e, "Failed to publish API spec scan cancel");
    }

    Ok(Json(serde_json::json!({
        "message": "API spec scan cancelled"
    })))
}
