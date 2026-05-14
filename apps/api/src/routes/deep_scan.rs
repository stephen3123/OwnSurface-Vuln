use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct StartDeepScanRequest {
    pub domain: String,
    pub max_pages: Option<i32>,
}

/// POST /deep-scan — Start a deep scan for a verified domain (Pro only)
pub async fn start_deep_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<StartDeepScanRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let monthly_limit = plan.deep_scans_per_month();
    if monthly_limit >= 0 {
        let used = db::count_user_deep_scans_this_month(&state.db, auth_user.id).await?;
        if used >= monthly_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} deep scan(s) this month. Upgrade to Pro for unlimited.",
                monthly_limit
            )));
        }
    }

    let domain = req.domain.trim().to_lowercase();
    let max_pages = req.max_pages.unwrap_or(500).min(500).max(10);

    // Verify the user owns this domain
    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden(
                "Domain must be verified before deep scanning. Use POST /domains/verify first."
                    .into(),
            )
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification is not yet complete".into(),
        ));
    }

    // Check for existing in-progress scan (use summary to avoid loading heavy results)
    let existing_scans = db::get_user_deep_scans_summary(&state.db, auth_user.id).await?;
    if let Some(existing) = existing_scans
        .iter()
        .find(|s| s.domain == domain && s.status == "running")
    {
        return Ok(Json(serde_json::json!({
            "deep_scan": existing,
            "message": "A deep scan is already in progress for this domain"
        })));
    }

    // Create deep scan record
    let deep_scan =
        db::create_deep_scan(&state.db, auth_user.id, &domain, verification.id, max_pages).await?;

    // Publish scan request to NATS for the crawler worker
    let payload = serde_json::json!({
        "deep_scan_id": deep_scan.id,
        "domain": domain,
        "max_pages": max_pages,
    });

    state
        .nats
        .publish("deepscan.request", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish deep scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(
        deep_scan_id = %deep_scan.id,
        domain = %domain,
        max_pages = max_pages,
        "Published deep scan request"
    );

    Ok(Json(serde_json::json!({
        "deep_scan": deep_scan,
        "message": "Deep scan started. Poll GET /deep-scan/{id} for progress."
    })))
}

/// GET /deep-scan/{id} — Get deep scan status and results
pub async fn get_deep_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_deep_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Deep scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your deep scan".into()));
    }

    let mut pages = Vec::new();
    let mut vulnerabilities: std::collections::HashMap<String, serde_json::Value> = std::collections::HashMap::new();
    let mut technologies: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut overall_score = 100;
    let mut total_score = 0;
    let mut score_count = 0;

    if let Some(results) = &scan.results {
        if let Some(pages_arr) = results.as_array() {
            for page in pages_arr {
                let url = page.get("url").and_then(|u| u.as_str()).unwrap_or("");
                let status_code = if page.get("status").and_then(|s| s.as_str()) == Some("success") { 200 } else { 500 };
                let mut p_score = 100;
                let mut issues_count = 0;

                if let Some(sr) = page.get("scan_result") {
                    if let Some(sec) = sr.get("security") {
                        if let Some(s) = sec.get("score").and_then(|s| s.as_i64()) {
                            p_score = s as i32;
                        }
                    }

                    if let Some(techs) = sr.get("tech_stack").and_then(|t| t.as_array()) {
                        for t in techs {
                            if let Some(name) = t.get("name").and_then(|n| n.as_str()) {
                                technologies.insert(name.to_string());
                            }
                        }
                    }

                    if let Some(findings) = sr.get("security_findings").and_then(|f| f.as_array()) {
                        issues_count = findings.len();
                        for finding in findings {
                            if let Some(fid) = finding.get("id").and_then(|i| i.as_str()) {
                                let entry = vulnerabilities.entry(fid.to_string()).or_insert_with(|| {
                                    let mut f = finding.clone();
                                    f["affected_pages"] = serde_json::json!([]);
                                    f
                                });
                                if let Some(arr) = entry.get_mut("affected_pages").and_then(|a| a.as_array_mut()) {
                                    if !arr.contains(&serde_json::json!(url)) {
                                        arr.push(serde_json::json!(url));
                                    }
                                }
                            }
                        }
                    }
                }

                total_score += p_score;
                score_count += 1;

                pages.push(serde_json::json!({
                    "url": url,
                    "status_code": status_code,
                    "security_score": p_score,
                    "issues_count": issues_count,
                    "scanned_at": scan.started_at,
                }));
            }
        }
    }

    if score_count > 0 {
        overall_score = total_score / score_count;
    }

    let vulns: Vec<serde_json::Value> = vulnerabilities.into_values().collect();
    let techs: Vec<String> = technologies.into_iter().collect();

    let scan_json = serde_json::json!({
        "id": scan.id,
        "domain": scan.domain,
        "status": scan.status,
        "pages_found": scan.pages_found,
        "pages_scanned": scan.pages_scanned,
        "started_at": scan.started_at,
        "completed_at": scan.completed_at,
        "overall_score": overall_score,
        "pages": pages,
        "vulnerabilities": vulns,
        "technologies": techs,
    });

    Ok(Json(serde_json::json!({
        "deep_scan": scan_json
    })))
}

/// POST /deep-scan/{id}/cancel — Cancel an in-progress deep scan
pub async fn cancel_deep_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_deep_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Deep scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your deep scan".into()));
    }

    if scan.status != "running" && scan.status != "scanning" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    db::update_deep_scan_status(&state.db, id, "cancelled").await?;

    // Notify the worker to stop (best-effort — worker may not subscribe to cancels yet)
    let payload = serde_json::json!({ "deep_scan_id": id });
    if let Err(e) = state
        .nats
        .publish(
            format!("deepscan.cancel.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(deep_scan_id = %id, error = %e, "Failed to publish deep scan cancel");
    }

    Ok(Json(serde_json::json!({
        "message": "Deep scan cancelled"
    })))
}

/// GET /deep-scan — List user's deep scans (without heavy results payload)
pub async fn list_deep_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_deep_scans_summary(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "deep_scans": scans
    })))
}
