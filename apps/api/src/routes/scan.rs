use axum::{extract::State, Extension, Json};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::scan_result::{ScanRequest, ScanResponse};
use crate::services::{cache, db, queue};
use crate::state::AppState;

pub async fn create_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<ScanRequest>,
) -> AppResult<Json<ScanResponse>> {
    let url = normalize_url(&req.url)?;
    let url_hash = hash_url(&url);

    // Check cache first
    if let Some(cached) = cache::get_cached_scan(&state, &url_hash).await? {
        // Must insert into DB so it shows up in their dashboard/compliance
        let result_json = serde_json::to_value(&cached)?;
        let scan_row = db::create_scan(&state.db, &url, &url_hash, Some(auth_user.id), &result_json).await?;
        
        return Ok(Json(ScanResponse {
            scan_id: scan_row.id,
            status: "cached".into(),
            result: Some(cached),
            cached: true,
        }));
    }

    // Check DB for recent scan locally (maybe another user scanned it)
    if let Some(db_scan) = db::get_scan_by_hash(&state.db, &url_hash).await? {
        let result: crate::models::scan_result::ScanResult =
            serde_json::from_value(db_scan.result.clone())?;

        // Must insert into DB for THIS user so they own a copy
        let scan_row = db::create_scan(&state.db, &url, &url_hash, Some(auth_user.id), &db_scan.result).await?;

        // Warm cache
        if let Err(e) = cache::set_cached_scan(&state, &url_hash, &result).await {
            tracing::debug!(url_hash = %url_hash, error = %e, "Failed to warm cache");
        }

        return Ok(Json(ScanResponse {
            scan_id: scan_row.id,
            status: "cached".into(),
            result: Some(result),
            cached: true,
        }));
    }

    // Subscribe first, then publish, then wait — prevents race condition
    // where worker responds before we start listening
    let scan_result = queue::publish_and_await_scan(&state, &url, &url_hash, 120).await?;

    // Store in DB and cache
    let result_json = serde_json::to_value(&scan_result)?;
    let scan_row =
        db::create_scan(&state.db, &url, &url_hash, Some(auth_user.id), &result_json).await?;

    // Store in history (non-blocking, but log failures)
    if let Err(e) = db::create_scan_history(&state.db, &url, &url_hash, Some(auth_user.id), &result_json).await {
        tracing::warn!(url = %url, error = %e, "Failed to create scan history");
    }

    // Populate lead intelligence indexes
    if let Err(e) = db::upsert_domain_profile_from_scan(&state.db, &url, &result_json).await {
        tracing::warn!(url = %url, error = %e, "Failed to upsert domain profile");
    }
    if let Err(e) = db::upsert_technology_index_from_scan(&state.db, &url, &result_json).await {
        tracing::warn!(url = %url, error = %e, "Failed to upsert technology index");
    }

    // Cache the result
    if let Err(e) = cache::set_cached_scan(&state, &url_hash, &scan_result).await {
        tracing::warn!(url = %url, error = %e, "Failed to cache scan result");
    }

    Ok(Json(ScanResponse {
        scan_id: scan_row.id,
        status: "completed".into(),
        result: Some(scan_result),
        cached: false,
    }))
}

pub async fn get_recent_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<crate::models::scan_result::ScanRow>>> {
    let scans = db::get_recent_scans(&state.db, auth_user.id, 20).await?;
    Ok(Json(scans))
}

pub async fn get_scan(
    State(state): State<AppState>,
    axum::extract::Path(hash): axum::extract::Path<String>,
) -> AppResult<Json<ScanResponse>> {
    // Check cache
    if let Some(cached) = cache::get_cached_scan(&state, &hash).await? {
        return Ok(Json(ScanResponse {
            scan_id: cached.id.unwrap_or_else(Uuid::new_v4),
            status: "cached".into(),
            result: Some(cached),
            cached: true,
        }));
    }

    // Check DB
    let scan = if let Some(scan) = db::get_scan_by_hash(&state.db, &hash).await? {
        scan
    } else {
        db::get_scan_history(&state.db, &hash, 1)
            .await?
            .into_iter()
            .next()
            .ok_or_else(|| AppError::NotFound("Scan not found".into()))?
    };

    let result: crate::models::scan_result::ScanResult =
        serde_json::from_value(scan.result.clone())?;

    Ok(Json(ScanResponse {
        scan_id: scan.id,
        status: "completed".into(),
        result: Some(result),
        cached: false,
    }))
}

/// GET /scan/site/{domain} — Public scan page data (no auth required)
pub async fn get_public_scan(
    State(state): State<AppState>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let domain = domain.trim().to_lowercase();

    let scan = db::get_scan_by_domain(&state.db, &domain)
        .await?
        .ok_or_else(|| AppError::NotFound("No scan data found for this domain".into()))?;

    Ok(Json(serde_json::json!({
        "domain": domain,
        "url": scan.url,
        "url_hash": scan.url_hash,
        "result": scan.result,
        "scanned_at": scan.scanned_at,
    })))
}

pub fn normalize_url(url: &str) -> AppResult<String> {
    let url = url.trim().to_lowercase();

    // Add https:// if no scheme
    let url = if !url.starts_with("http://") && !url.starts_with("https://") {
        format!("https://{}", url)
    } else {
        url
    };

    // Basic validation
    if !url.contains('.') {
        return Err(AppError::BadRequest("Invalid URL".into()));
    }

    // SSRF protection - block private IPs
    let host = url
        .split("://")
        .nth(1)
        .and_then(|s| s.split('/').next())
        .and_then(|s| s.split(':').next())
        .unwrap_or("");

    let blocked_prefixes = [
        // Loopback
        "localhost",
        "127.",
        "0.0.0.0",
        // IPv6 loopback and mapped
        "::1",
        "::ffff:",
        "[::1]",
        "[::ffff:",
        // RFC 1918 private ranges
        "10.",
        "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.",
        "172.24.", "172.25.", "172.26.", "172.27.",
        "172.28.", "172.29.", "172.30.", "172.31.",
        "192.168.",
        // Link-local (AWS/GCP/Azure metadata)
        "169.254.",
        // IPv6 private ranges
        "fc00:", "fd00:", "fe80:",
        // Cloud metadata hostnames
        "metadata.google.internal",
        "metadata.google.",
    ];

    let blocked_exact = [
        "0",
        "[::1]",
        "[::ffff:127.0.0.1]",
    ];

    for prefix in &blocked_prefixes {
        if host.starts_with(prefix) {
            return Err(AppError::BadRequest(
                "Scanning internal/private addresses is not allowed".into(),
            ));
        }
    }

    for exact in &blocked_exact {
        if host == *exact {
            return Err(AppError::BadRequest(
                "Scanning internal/private addresses is not allowed".into(),
            ));
        }
    }

    // Block hex/octal IP representations (e.g., 0x7f000001, 2130706433)
    if host.starts_with("0x") || host.parse::<u64>().is_ok() {
        return Err(AppError::BadRequest(
            "Scanning internal/private addresses is not allowed".into(),
        ));
    }

    // Remove trailing slash
    let url = url.trim_end_matches('/').to_string();

    Ok(url)
}

fn hash_url(url: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    hex::encode(hasher.finalize())
}
