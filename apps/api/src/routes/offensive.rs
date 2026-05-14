use axum::{
    extract::{ConnectInfo, State},
    Extension, Json,
};
use serde::Deserialize;
use std::net::SocketAddr;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct StartOffensiveScanRequest {
    pub domain: String,
    pub scope: Option<serde_json::Value>,
    pub rate_limit: Option<String>,
    pub scope_contract_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScopeContractRequest {
    pub domain: String,
    pub scope_mode: Option<String>,
    pub excluded_targets: Option<Vec<String>>,
    pub include_third_party: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ConfirmTargetsRequest {
    pub confirmed_targets: Vec<String>,
}

/// POST /offensive-scan/scope-contract — Create a scope contract for offensive scanning
pub async fn create_scope_contract(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::ConnectInfo(addr): axum::extract::ConnectInfo<SocketAddr>,
    headers: axum::http::HeaderMap,
    Json(req): Json<CreateScopeContractRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let domain = req.domain.trim().to_lowercase();
    let scope_mode = req.scope_mode.unwrap_or_else(|| "root_only".to_string());

    if !["root_only", "include_subs", "custom_list"].contains(&scope_mode.as_str()) {
        return Err(AppError::BadRequest(
            "scope_mode must be root_only, include_subs, or custom_list".into(),
        ));
    }

    // Verify domain ownership
    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden("Domain must be verified before creating a scope contract".into())
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Capture signer IP from X-Forwarded-For or connection
    let signer_ip = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.split(',').next().unwrap_or("").trim().to_string())
        .unwrap_or_else(|| addr.ip().to_string());

    let signer_user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let contract = db::create_scope_contract(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        &scope_mode,
        &req.excluded_targets.unwrap_or_default(),
        req.include_third_party.unwrap_or(false),
        &signer_ip,
        &signer_user_agent,
    )
    .await?;

    Ok(Json(serde_json::json!({
        "contract": contract,
        "message": "Scope contract created successfully"
    })))
}

/// GET /offensive-scan/scope-contracts — List active (non-expired) scope contracts
pub async fn list_scope_contracts(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let contracts = db::get_active_scope_contracts(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "contracts": contracts
    })))
}

/// POST /offensive-scan — Start an offensive security scan for a verified domain (Pro only)
pub async fn start_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<StartOffensiveScanRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let monthly_limit = plan.offensive_scans_per_month();
    if monthly_limit == 0 {
        return Err(AppError::Forbidden(
            "Offensive scanning requires a Pro plan. Upgrade at https://ownsurface.com/dashboard/billing".into(),
        ));
    } else if monthly_limit > 0 {
        let used = db::count_user_offensive_scans_this_month(&state.db, auth_user.id).await?;
        if used >= monthly_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} offensive scan(s) this month.",
                monthly_limit
            )));
        }
    }
    // monthly_limit == -1 means unlimited (Pro), skip check

    let domain = req.domain.trim().to_lowercase();
    let scope = req.scope.unwrap_or(serde_json::json!({
        "sqli_testing": true,
        "xss_testing": true,
        "csrf_testing": true,
        "ssrf_testing": true,
        "auth_bypass_testing": true
    }));
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
                "Domain must be verified before offensive scanning. Use POST /domains/verify first.".into(),
            )
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Check for existing in-progress scan on this domain
    let existing = db::get_user_offensive_scans(&state.db, auth_user.id).await?;
    if let Some(running) = existing
        .iter()
        .find(|s| s.domain == domain && s.status == "running")
    {
        return Ok(Json(serde_json::json!({
            "scan": running,
            "message": "An offensive scan is already in progress for this domain"
        })));
    }

    // Max 3 concurrent scans per user
    let running_count = existing.iter().filter(|s| s.status == "running").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent offensive scans allowed. Wait for one to complete.".into(),
        ));
    }

    // Require a valid scope contract
    let scope_contract_id = req.scope_contract_id.ok_or_else(|| {
        AppError::BadRequest(
            "scope_contract_id is required. Create a scope contract first via POST /offensive-scan/scope-contract".into(),
        )
    })?;

    let contract = db::get_scope_contract(&state.db, scope_contract_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Scope contract not found".into()))?;

    if contract.user_id != auth_user.id {
        return Err(AppError::Forbidden("Scope contract does not belong to you".into()));
    }
    if contract.domain != domain {
        return Err(AppError::BadRequest("Scope contract domain does not match scan domain".into()));
    }
    if contract.expires_at < chrono::Utc::now() {
        return Err(AppError::BadRequest("Scope contract has expired. Create a new one.".into()));
    }

    // Create scan record
    let scan = db::create_offensive_scan(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        &scope,
        &rate_limit,
    )
    .await?;

    // Link scope contract to scan
    db::link_scope_contract_to_scan(&state.db, scan.id, scope_contract_id).await?;

    // Publish scan request to NATS for the worker
    let payload = serde_json::json!({
        "scan_id": scan.id,
        "user_id": auth_user.id,
        "domain": domain,
        "scope": scope,
        "rate_limit": rate_limit,
        "scope_contract_id": scope_contract_id,
    });

    state
        .nats
        .publish(
            "offensive.request",
            payload.to_string().into(),
        )
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish offensive scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(
        scan_id = %scan.id,
        domain = %domain,
        "Published offensive scan request"
    );

    Ok(Json(serde_json::json!({
        "scan": scan,
        "message": "Offensive scan started. Poll GET /offensive-scan/{id} for progress."
    })))
}

/// GET /offensive-scan/{id} — Get scan status and results
pub async fn get_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    Ok(Json(serde_json::json!({
        "scan": scan
    })))
}

/// GET /offensive-scan — List user's offensive scans
pub async fn list_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_offensive_scans(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "scans": scans
    })))
}

/// POST /offensive-scan/{id}/cancel — Cancel an in-progress scan
pub async fn cancel_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    db::update_offensive_scan_status(&state.db, id, "cancelled").await?;

    let payload = serde_json::json!({ "scan_id": id });
    if let Err(e) = state
        .nats
        .publish(
            format!("offensive.cancel.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(scan_id = %id, error = %e, "Failed to publish offensive scan cancel");
    }

    Ok(Json(serde_json::json!({
        "message": "Offensive scan cancelled"
    })))
}

/// POST /offensive-scan/{id}/kill — Emergency kill switch for a running scan
pub async fn kill_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "classifying" && scan.status != "awaiting_confirmation" {
        return Err(AppError::BadRequest(
            "Only active scans can be killed".into(),
        ));
    }

    db::update_offensive_scan_status(&state.db, id, "killed").await?;

    let payload = serde_json::json!({ "scan_id": id, "reason": "user_kill_switch" });
    if let Err(e) = state
        .nats
        .publish(
            format!("offensive.kill.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(scan_id = %id, error = %e, "Failed to publish kill signal");
    }

    let _ = state.nats.flush().await;

    tracing::warn!(scan_id = %id, user_id = %auth_user.id, "Kill switch activated");

    Ok(Json(serde_json::json!({
        "message": "Kill signal sent. All processes will be terminated."
    })))
}

/// POST /offensive-scan/{id}/confirm-risk — Acknowledge high risk and proceed
pub async fn confirm_risk(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "awaiting_confirmation" {
        return Err(AppError::BadRequest(
            "Scan is not awaiting risk confirmation".into(),
        ));
    }

    db::update_offensive_scan_status(&state.db, id, "pending").await?;

    // Re-publish to NATS to resume the scan
    let payload = serde_json::json!({ "scan_id": id, "confirmed": true });
    state
        .nats
        .publish(
            format!("offensive.confirmed.{}", id),
            payload.to_string().into(),
        )
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish confirmation: {}", e)))?;

    let _ = state.nats.flush().await;

    Ok(Json(serde_json::json!({
        "message": "Risk acknowledged. Scan will proceed."
    })))
}

/// POST /offensive-scan/{id}/confirm-targets — Confirm targets for progressive scanning
pub async fn confirm_targets(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<ConfirmTargetsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "awaiting_confirmation" && scan.status != "classifying" {
        return Err(AppError::BadRequest(
            "Scan is not awaiting target confirmation".into(),
        ));
    }

    let payload = serde_json::json!({
        "scan_id": id,
        "confirmed_targets": req.confirmed_targets,
    });

    state
        .nats
        .publish(
            format!("offensive.confirmed.{}", id),
            payload.to_string().into(),
        )
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish target confirmation: {}", e)))?;

    let _ = state.nats.flush().await;

    Ok(Json(serde_json::json!({
        "message": "Targets confirmed. Active scan will begin.",
        "confirmed_count": req.confirmed_targets.len()
    })))
}

/// GET /offensive-scan/{id}/replay — Get audit trail for scan replay
pub async fn get_scan_replay(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_offensive_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Offensive scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    let events = db::get_audit_log_for_scan(&state.db, id).await?;

    Ok(Json(serde_json::json!({
        "scan_id": id,
        "events": events,
        "count": events.len()
    })))
}
