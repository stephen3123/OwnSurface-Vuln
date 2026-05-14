use axum::{extract::State, http::StatusCode, response::IntoResponse, Extension, Json};
use serde::Deserialize;
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::queue;
use crate::state::AppState;

use super::scan::normalize_url;

#[derive(Debug, Deserialize)]
pub struct EnrichRequest {
    pub domain: String,
}

/// POST /api/v1/enrich — Lead enrichment endpoint (Pro only)
/// Takes a domain, triggers a scan, and returns structured enrichment data
pub async fn enrich_domain(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<EnrichRequest>,
) -> AppResult<impl IntoResponse> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_enrichment() {
        return Err(AppError::Forbidden(
            "Lead enrichment requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let domain = payload.domain.trim().to_lowercase();
    if domain.is_empty() {
        return Err(AppError::BadRequest("Domain is required".into()));
    }

    // Normalize URL — reuse scan.rs logic for SSRF protection and consistent hashing
    let url = normalize_url(&domain)?;
    let url_hash = hex::encode(Sha256::digest(url.as_bytes()));

    // Check if we have a recent scan cached
    let cached = crate::services::db::get_scan_by_hash(&state.db, &url_hash).await?;

    if let Some(scan_row) = cached {
        let enrichment = map_to_enrichment(&url, &scan_row.result);
        return Ok((StatusCode::OK, Json(enrichment)));
    }

    // No cached result — subscribe first, then publish (prevents race condition)
    let scan_result = queue::publish_and_await_scan(&state, &url, &url_hash, 60).await?;
    let result = serde_json::to_value(&scan_result)?;

    // Store the scan
    if let Err(e) = crate::services::db::create_scan(
        &state.db,
        &url,
        &url_hash,
        Some(auth_user.id),
        &result,
    )
    .await
    {
        tracing::warn!(url = %url, error = %e, "Failed to store enrichment scan");
    }

    // Populate lead intelligence indexes
    if let Err(e) = crate::services::db::upsert_domain_profile_from_scan(&state.db, &url, &result).await {
        tracing::warn!(url = %url, error = %e, "Failed to upsert domain profile");
    }
    if let Err(e) = crate::services::db::upsert_technology_index_from_scan(&state.db, &url, &result).await {
        tracing::warn!(url = %url, error = %e, "Failed to upsert technology index");
    }

    let enrichment = map_to_enrichment(&url, &result);
    Ok((StatusCode::OK, Json(enrichment)))
}

fn map_to_enrichment(url: &str, result: &serde_json::Value) -> serde_json::Value {
    json!({
        "domain": url,
        "company": {
            "name": result.get("company").and_then(|c| c.get("name")).and_then(|v| v.as_str()),
            "description": result.get("company").and_then(|c| c.get("description")).and_then(|v| v.as_str()),
            "industry": result.get("company").and_then(|c| c.get("industry")).and_then(|v| v.as_str()),
            "logo": result.get("company").and_then(|c| c.get("logo")).and_then(|v| v.as_str()),
            "location": result.get("company").and_then(|c| c.get("location")).and_then(|v| v.as_str()),
            "employees_range": result.get("company").and_then(|c| c.get("employees_range")).and_then(|v| v.as_str()),
            "founded": result.get("company").and_then(|c| c.get("founded")).and_then(|v| v.as_str()),
        },
        "tech_stack": result.get("tech_stack").cloned().unwrap_or(json!([])),
        "social_links": result.get("social_links").cloned().unwrap_or(json!([])),
        "security": {
            "score": result.get("security").and_then(|s| s.get("score")).and_then(|v| v.as_u64()),
            "grade": result.get("security").and_then(|s| s.get("grade")).and_then(|v| v.as_str()),
            "https": result.get("security").and_then(|s| s.get("https_redirect")).and_then(|v| v.as_bool()),
        },
        "seo": {
            "score": result.get("seo").and_then(|s| s.get("score")).and_then(|v| v.as_u64()),
            "title": result.get("seo").and_then(|s| s.get("meta_title")).and_then(|v| v.as_str()),
            "description": result.get("seo").and_then(|s| s.get("meta_description")).and_then(|v| v.as_str()),
        },
        "traffic": result.get("traffic").cloned().unwrap_or(json!(null)),
        "business_signals": result.get("business_signals").cloned().unwrap_or(json!(null)),
        "cost_estimate": result.get("cost_estimate").cloned().unwrap_or(json!(null)),
        "vulnerability": result.get("vulnerability").cloned().unwrap_or(json!(null)),
        "ai_summary": result.get("ai_summary").and_then(|v| v.as_str()),
        "scanned_at": result.get("scanned_at").and_then(|v| v.as_str()),
        "email_patterns": result.get("email_patterns").cloned().unwrap_or(json!(null)),
        "carbon": result.get("carbon").cloned().unwrap_or(json!(null)),
        "security_findings": result.get("security_findings").cloned().unwrap_or(json!([])),
    })
}

/// GET /api/v1/enrich/{domain} — GET version of enrichment (easier for developers)
pub async fn enrich_domain_get(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<impl IntoResponse> {
    enrich_domain(
        State(state),
        Extension(auth_user),
        Json(EnrichRequest { domain }),
    )
    .await
}

/// GET /api/v1/enrich/{domain}/company — Company info only
pub async fn enrich_company(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<impl IntoResponse> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_enrichment() {
        return Err(AppError::Forbidden(
            "Lead enrichment requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let url = normalize_url(&domain)?;
    let url_hash = hex::encode(Sha256::digest(url.as_bytes()));
    let cached = crate::services::db::get_scan_by_hash(&state.db, &url_hash).await?;

    if let Some(scan_row) = cached {
        let result = &scan_row.result;
        return Ok((
            StatusCode::OK,
            Json(json!({
                "domain": url,
                "company": result.get("company").cloned().unwrap_or(json!(null)),
                "social_links": result.get("social_links").cloned().unwrap_or(json!([])),
                "email_patterns": result.get("email_patterns").cloned().unwrap_or(json!(null)),
            })),
        ));
    }

    Err(AppError::NotFound(
        "No cached data for this domain. Use POST /api/v1/enrich or GET /api/v1/enrich/{domain} to trigger a scan first.".into(),
    ))
}

/// GET /api/v1/enrich/{domain}/tech — Tech stack only
pub async fn enrich_tech(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<impl IntoResponse> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_enrichment() {
        return Err(AppError::Forbidden(
            "Lead enrichment requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let url = normalize_url(&domain)?;
    let url_hash = hex::encode(Sha256::digest(url.as_bytes()));
    let cached = crate::services::db::get_scan_by_hash(&state.db, &url_hash).await?;

    if let Some(scan_row) = cached {
        let result = &scan_row.result;
        return Ok((
            StatusCode::OK,
            Json(json!({
                "domain": url,
                "tech_stack": result.get("tech_stack").cloned().unwrap_or(json!([])),
                "cost_estimate": result.get("cost_estimate").cloned().unwrap_or(json!(null)),
            })),
        ));
    }

    Err(AppError::NotFound(
        "No cached data for this domain. Use POST /api/v1/enrich or GET /api/v1/enrich/{domain} to trigger a scan first.".into(),
    ))
}

/// GET /api/v1/enrich/{domain}/security — Security posture only
pub async fn enrich_security(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<impl IntoResponse> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_enrichment() {
        return Err(AppError::Forbidden(
            "Lead enrichment requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let url = normalize_url(&domain)?;
    let url_hash = hex::encode(Sha256::digest(url.as_bytes()));
    let cached = crate::services::db::get_scan_by_hash(&state.db, &url_hash).await?;

    if let Some(scan_row) = cached {
        let result = &scan_row.result;
        return Ok((
            StatusCode::OK,
            Json(json!({
                "domain": url,
                "security": result.get("security").cloned().unwrap_or(json!(null)),
                "security_findings": result.get("security_findings").cloned().unwrap_or(json!([])),
                "vulnerability": result.get("vulnerability").cloned().unwrap_or(json!(null)),
            })),
        ));
    }

    Err(AppError::NotFound(
        "No cached data for this domain. Use POST /api/v1/enrich or GET /api/v1/enrich/{domain} to trigger a scan first.".into(),
    ))
}


