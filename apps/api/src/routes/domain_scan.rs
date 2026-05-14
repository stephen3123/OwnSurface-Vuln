use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

fn default_pentest_scope() -> serde_json::Value {
    serde_json::json!({
        "sqli_testing": true,
        "xss_testing": true,
        "csrf_testing": true,
        "ssrf_testing": true,
        "jwt_testing": true,
        "auth_bypass_testing": true,
        "deep_subdomain_enum": true,
        "port_scan": true,
        "deep_directory_bruteforce": true,
        "cloud_bucket_check": true,
        "secret_scanning": true,
        "active_waf_detection": true,
        "path_traversal": true,
        "open_redirect_deep": true,
        "idor_testing": true,
        "rate_limit_testing": true,
        "user_enumeration": true,
        "session_testing": true,
        "graphql_testing": true,
        "api_fuzzing": true,
        "xss_browser_verify": true,
        "stored_xss_testing": true,
        "content_type_manipulation": true,
        "cross_page_scanning": true,
        "csrf_xss_combo": true
    })
}

fn default_api_scope() -> serde_json::Value {
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

#[derive(Debug, Deserialize)]
pub struct StartDomainScanRequest {
    pub domain: String,
    pub mode: String,
    pub scope: Option<serde_json::Value>,
    pub rate_limit: Option<String>,
    pub scope_contract_id: Option<Uuid>,
    pub spec_content: Option<String>,
}

/// POST /domain-scan — Start a unified domain scan (security, pentest, or api mode)
pub async fn start_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<StartDomainScanRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());

    // All domain scan modes require Pro
    let monthly_limit = plan.deep_scans_per_month();
    if monthly_limit == 0 {
        return Err(AppError::Forbidden(
            "Domain scans require a Pro plan. Upgrade at https://ownsurface.com/dashboard/billing"
                .into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();
    let mode = req.mode.trim().to_lowercase();

    if !["security", "pentest", "api"].contains(&mode.as_str()) {
        return Err(AppError::BadRequest(
            "mode must be security, pentest, or api".into(),
        ));
    }

    let scope = match mode.as_str() {
        "pentest" => req.scope.unwrap_or_else(default_pentest_scope),
        "api" => req.scope.unwrap_or_else(default_api_scope),
        _ => req.scope.unwrap_or(serde_json::json!({})),
    };
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
                "Domain must be verified before scanning. Use POST /domains/verify first.".into(),
            )
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Check for existing in-progress domain scan on this domain
    let existing = db::get_user_domain_scans(&state.db, auth_user.id).await?;
    if let Some(running) = existing
        .iter()
        .find(|s| s.domain == domain && s.mode == mode && (s.status == "running" || s.status == "pending"))
    {
        return Ok(Json(serde_json::json!({
            "scan": running,
            "message": "A domain scan is already in progress for this domain and mode"
        })));
    }

    // Max 3 concurrent domain scans per user
    let running_count = existing
        .iter()
        .filter(|s| s.status == "running" || s.status == "pending")
        .count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent domain scans allowed. Wait for one to complete.".into(),
        ));
    }

    // For pentest mode: validate scope contract
    let mut scope_contract_id: Option<Uuid> = None;
    if mode == "pentest" {
        let contract_id = req.scope_contract_id.ok_or_else(|| {
            AppError::BadRequest(
                "scope_contract_id is required for pentest mode. Create one via POST /offensive-scan/scope-contract".into(),
            )
        })?;

        let contract = db::get_scope_contract(&state.db, contract_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Scope contract not found".into()))?;

        if contract.user_id != auth_user.id {
            return Err(AppError::Forbidden(
                "Scope contract does not belong to you".into(),
            ));
        }
        if contract.domain != domain {
            return Err(AppError::BadRequest(
                "Scope contract domain does not match scan domain".into(),
            ));
        }
        if contract.expires_at < chrono::Utc::now() {
            return Err(AppError::BadRequest(
                "Scope contract has expired. Create a new one.".into(),
            ));
        }

        scope_contract_id = Some(contract_id);
    }

    // For api mode: require spec_content
    let spec_content = if mode == "api" {
        let spec = req.spec_content.as_deref().ok_or_else(|| {
            AppError::BadRequest("spec_content is required for api mode (OpenAPI/Swagger JSON or YAML)".into())
        })?;
        if spec.len() < 20 {
            return Err(AppError::BadRequest("spec_content is too short to be a valid spec".into()));
        }
        Some(spec)
    } else {
        None
    };

    // Create domain_scans record
    let domain_scan = db::create_domain_scan(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        &mode,
        &scope,
        &rate_limit,
        spec_content,
    )
    .await?;

    // Orchestrate child scans based on mode
    let mut deep_scan_id: Option<Uuid> = None;
    let mut attack_surface_id: Option<Uuid> = None;
    let mut offensive_scan_id: Option<Uuid> = None;
    let mut api_spec_scan_id: Option<Uuid> = None;

    match mode.as_str() {
        "security" => {
            // Create deep scan + attack surface audit
            let ds = db::create_deep_scan(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                500, // default max_pages
            )
            .await?;
            deep_scan_id = Some(ds.id);

            let asa = db::create_attack_surface_audit(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                &scope,
                &rate_limit,
            )
            .await?;
            attack_surface_id = Some(asa.id);

            // Pair them together
            db::pair_full_audit(&state.db, asa.id, ds.id).await?;

            // Publish to NATS
            let ds_payload = serde_json::json!({
                "deep_scan_id": ds.id,
                "domain": domain,
                "max_pages": 500,
            });
            state
                .nats
                .publish("deepscan.request", ds_payload.to_string().into())
                .await
                .map_err(|e| AppError::Queue(format!("Failed to publish deep scan: {}", e)))?;

            let asa_payload = serde_json::json!({
                "audit_id": asa.id,
                "domain": domain,
                "scope": scope,
                "rate_limit": rate_limit,
            });
            state
                .nats
                .publish("attacksurface.request", asa_payload.to_string().into())
                .await
                .map_err(|e| AppError::Queue(format!("Failed to publish attack surface: {}", e)))?;
        }

        "pentest" => {
            // Create deep scan + attack surface + offensive scan
            let ds = db::create_deep_scan(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                500,
            )
            .await?;
            deep_scan_id = Some(ds.id);

            let asa = db::create_attack_surface_audit(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                &scope,
                &rate_limit,
            )
            .await?;
            attack_surface_id = Some(asa.id);

            db::pair_full_audit(&state.db, asa.id, ds.id).await?;

            let os = db::create_offensive_scan(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                &scope,
                &rate_limit,
            )
            .await?;
            offensive_scan_id = Some(os.id);

            // Link scope contract to offensive scan
            if let Some(contract_id) = scope_contract_id {
                db::link_scope_contract_to_scan(&state.db, os.id, contract_id).await?;
            }

            // Publish all three to NATS
            let ds_payload = serde_json::json!({
                "deep_scan_id": ds.id,
                "domain": domain,
                "max_pages": 500,
            });
            state
                .nats
                .publish("deepscan.request", ds_payload.to_string().into())
                .await
                .map_err(|e| AppError::Queue(format!("Failed to publish deep scan: {}", e)))?;

            let asa_payload = serde_json::json!({
                "audit_id": asa.id,
                "domain": domain,
                "scope": scope,
                "rate_limit": rate_limit,
            });
            state
                .nats
                .publish("attacksurface.request", asa_payload.to_string().into())
                .await
                .map_err(|e| {
                    AppError::Queue(format!("Failed to publish attack surface: {}", e))
                })?;

            let os_payload = serde_json::json!({
                "scan_id": os.id,
                "user_id": auth_user.id,
                "domain": domain,
                "scope": scope,
                "rate_limit": rate_limit,
                "scope_contract_id": scope_contract_id,
            });
            state
                .nats
                .publish("offensive.request", os_payload.to_string().into())
                .await
                .map_err(|e| {
                    AppError::Queue(format!("Failed to publish offensive scan: {}", e))
                })?;
        }

        "api" => {
            // Determine spec format from content
            let spec_text = spec_content.unwrap_or("");
            let spec_format = if spec_text.contains("\"swagger\"") || spec_text.contains("swagger:") {
                "swagger"
            } else {
                "openapi3"
            };

            let api_scan = db::create_api_spec_scan(
                &state.db,
                auth_user.id,
                &domain,
                verification.id,
                spec_format,
                &scope,
                &rate_limit,
            )
            .await?;
            api_spec_scan_id = Some(api_scan.id);

            let payload = serde_json::json!({
                "scan_id": api_scan.id,
                "user_id": auth_user.id,
                "domain": domain,
                "spec_content": spec_text,
                "spec_format": spec_format,
                "scope": scope,
                "rate_limit": rate_limit,
            });
            state
                .nats
                .publish("apispec.request", payload.to_string().into())
                .await
                .map_err(|e| {
                    AppError::Queue(format!("Failed to publish API spec scan: {}", e))
                })?;
        }
        _ => unreachable!(),
    }

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    // Update domain scan with child IDs
    db::update_domain_scan_child_ids(
        &state.db,
        domain_scan.id,
        deep_scan_id,
        attack_surface_id,
        offensive_scan_id,
        api_spec_scan_id,
        scope_contract_id,
    )
    .await?;

    db::update_domain_scan_status(&state.db, domain_scan.id, "running").await?;

    tracing::info!(
        domain_scan_id = %domain_scan.id,
        domain = %domain,
        mode = %mode,
        "Started unified domain scan"
    );

    // Re-fetch to get updated child IDs
    let scan = db::get_domain_scan(&state.db, domain_scan.id).await?;

    Ok(Json(serde_json::json!({
        "scan": scan,
        "message": format!("Domain scan ({}) started. Poll GET /domain-scan/{{id}} for progress.", mode)
    })))
}

/// GET /domain-scan/{id} — Get unified scan with aggregated child results
pub async fn get_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_domain_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Domain scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    // Fetch child scan details and aggregate status on-read
    let mut children = serde_json::json!({});
    let mut all_statuses: Vec<String> = Vec::new();
    let mut total_critical = 0i32;
    let mut total_high = 0i32;
    let mut total_medium = 0i32;
    let mut total_low = 0i32;
    let mut total_info = 0i32;

    if let Some(ds_id) = scan.deep_scan_id {
        if let Some(ds) = db::get_deep_scan(&state.db, ds_id).await? {
            all_statuses.push(ds.status.clone());
            children["deep_scan"] = serde_json::json!({
                "id": ds.id,
                "status": ds.status,
                "pages_found": ds.pages_found,
                "pages_scanned": ds.pages_scanned,
                "severity_critical": 0,
                "severity_high": 0,
                "severity_medium": 0,
                "severity_low": 0,
                "severity_info": 0,
                "started_at": ds.started_at,
                "completed_at": ds.completed_at,
            });
        }
    }

    if let Some(asa_id) = scan.attack_surface_id {
        if let Some(asa) = db::get_attack_surface_audit(&state.db, asa_id).await? {
            all_statuses.push(asa.status.clone());
            total_critical += asa.severity_critical;
            total_high += asa.severity_high;
            total_medium += asa.severity_medium;
            total_low += asa.severity_low;
            total_info += asa.severity_info;
            children["attack_surface"] = serde_json::json!({
                "id": asa.id,
                "status": asa.status,
                "severity_critical": asa.severity_critical,
                "severity_high": asa.severity_high,
                "severity_medium": asa.severity_medium,
                "severity_low": asa.severity_low,
                "severity_info": asa.severity_info,
                "tier1_status": asa.tier1_status,
                "tier2_status": asa.tier2_status,
                "tier3_status": asa.tier3_status,
                "tier4_status": asa.tier4_status,
                "started_at": asa.started_at,
                "completed_at": asa.completed_at,
            });
        }
    }

    if let Some(os_id) = scan.offensive_scan_id {
        if let Some(os) = db::get_offensive_scan(&state.db, os_id).await? {
            all_statuses.push(os.status.clone());
            total_critical += os.severity_critical;
            total_high += os.severity_high;
            total_medium += os.severity_medium;
            total_low += os.severity_low;
            total_info += os.severity_info;
            children["offensive"] = serde_json::json!({
                "id": os.id,
                "status": os.status,
                "severity_critical": os.severity_critical,
                "severity_high": os.severity_high,
                "severity_medium": os.severity_medium,
                "severity_low": os.severity_low,
                "severity_info": os.severity_info,
                "tools_used": os.tools_used,
                "started_at": os.started_at,
                "completed_at": os.completed_at,
            });
        }
    }

    if let Some(api_id) = scan.api_spec_scan_id {
        if let Some(api) = db::get_api_spec_scan(&state.db, api_id).await? {
            all_statuses.push(api.status.clone());
            total_critical += api.severity_critical;
            total_high += api.severity_high;
            total_medium += api.severity_medium;
            total_low += api.severity_low;
            total_info += api.severity_info;
            children["api_spec"] = serde_json::json!({
                "id": api.id,
                "status": api.status,
                "endpoints_found": api.endpoints_found,
                "severity_critical": api.severity_critical,
                "severity_high": api.severity_high,
                "severity_medium": api.severity_medium,
                "severity_low": api.severity_low,
                "severity_info": api.severity_info,
                "tools_used": api.tools_used,
                "started_at": api.started_at,
                "completed_at": api.completed_at,
            });
        }
    }

    // Derive aggregate status from children
    let aggregate_status = if all_statuses.iter().any(|s| s == "failed") {
        "partial_failure"
    } else if all_statuses.iter().all(|s| s == "complete") {
        "complete"
    } else if all_statuses.iter().any(|s| s == "running" || s == "scanning") {
        "running"
    } else if all_statuses.iter().all(|s| s == "cancelled") {
        "cancelled"
    } else {
        "pending"
    };

    let total_findings = total_critical + total_high + total_medium + total_low + total_info;

    // Update parent record if status changed
    if aggregate_status != scan.status {
        db::update_domain_scan_status(&state.db, scan.id, aggregate_status).await?;
        db::update_domain_scan_findings(
            &state.db,
            scan.id,
            total_findings,
            total_critical,
            total_high,
            total_medium,
            total_low,
            total_info,
        )
        .await?;
    }

    Ok(Json(serde_json::json!({
        "scan": {
            "id": scan.id,
            "domain": scan.domain,
            "mode": scan.mode,
            "status": aggregate_status,
            "total_findings": total_findings,
            "severity_critical": total_critical,
            "severity_high": total_high,
            "severity_medium": total_medium,
            "severity_low": total_low,
            "severity_info": total_info,
            "rate_limit": scan.rate_limit,
            "started_at": scan.started_at,
            "completed_at": scan.completed_at,
            "created_at": scan.created_at,
        },
        "children": children,
    })))
}

/// GET /domain-scan — List user's domain scans
pub async fn list_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_domain_scans(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "scans": scans
    })))
}

/// POST /domain-scan/{id}/cancel — Cancel all linked child scans
pub async fn cancel_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_domain_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Domain scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    // Cancel all child scans
    if let Some(ds_id) = scan.deep_scan_id {
        db::update_deep_scan_status(&state.db, ds_id, "cancelled").await.ok();
        let payload = serde_json::json!({ "deep_scan_id": ds_id });
        state
            .nats
            .publish(format!("deepscan.cancel.{}", ds_id), payload.to_string().into())
            .await
            .ok();
    }

    if let Some(asa_id) = scan.attack_surface_id {
        db::update_attack_surface_status(&state.db, asa_id, "cancelled").await.ok();
        let payload = serde_json::json!({ "audit_id": asa_id });
        state
            .nats
            .publish(format!("attacksurface.cancel.{}", asa_id), payload.to_string().into())
            .await
            .ok();
    }

    if let Some(os_id) = scan.offensive_scan_id {
        db::update_offensive_scan_status(&state.db, os_id, "cancelled").await.ok();
        let payload = serde_json::json!({ "scan_id": os_id });
        state
            .nats
            .publish(format!("offensive.kill.{}", os_id), payload.to_string().into())
            .await
            .ok();
    }

    if let Some(api_id) = scan.api_spec_scan_id {
        db::update_api_spec_scan_status(&state.db, api_id, "cancelled").await.ok();
        let payload = serde_json::json!({ "scan_id": api_id });
        state
            .nats
            .publish(format!("apispec.cancel.{}", api_id), payload.to_string().into())
            .await
            .ok();
    }

    db::update_domain_scan_status(&state.db, id, "cancelled").await?;

    Ok(Json(serde_json::json!({
        "message": "Domain scan and all child scans cancelled"
    })))
}
