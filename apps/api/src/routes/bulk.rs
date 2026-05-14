use axum::{extract::State, http::StatusCode, Extension, Json};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::scan_result::ScanRow;
use crate::models::user::Plan;
use crate::services::{db, queue};
use crate::state::AppState;

use super::scan::normalize_url;

#[derive(Debug, serde::Deserialize)]
pub struct BulkScanRequest {
    pub urls: Vec<String>,
}

#[derive(Debug, serde::Serialize)]
pub struct BulkJobResponse {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub status: String,
    pub total_urls: i32,
    pub completed_urls: i32,
    pub failed_urls: i32,
    pub urls: Vec<String>,
    pub results: Option<Vec<ScanRow>>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

pub async fn create_bulk_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<BulkScanRequest>,
) -> AppResult<(StatusCode, Json<BulkJobResponse>)> {
    let plan = Plan::from(auth_user.plan.clone());
    let max = plan.max_bulk_urls();

    if req.urls.is_empty() {
        return Err(AppError::BadRequest("No URLs provided".into()));
    }

    if max > 0 && req.urls.len() > max as usize {
        return Err(AppError::BadRequest(format!(
            "Maximum {} URLs per bulk scan on your plan",
            max
        )));
    }

    // Enforce monthly bulk job limit for Free plan
    let monthly_limit = plan.bulk_scans_per_month();
    if monthly_limit >= 0 {
        let used = db::count_user_bulk_jobs_this_month(&state.db, auth_user.id).await?;
        if used >= monthly_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} bulk scan(s) this month. Upgrade to Pro for unlimited.",
                monthly_limit
            )));
        }
    }

    // Validate all URLs for SSRF before queuing any
    let mut validated_urls = Vec::with_capacity(req.urls.len());
    for url in &req.urls {
        let normalized = normalize_url(url)?;
        validated_urls.push(normalized);
    }

    let job = db::create_bulk_job(&state.db, auth_user.id, &validated_urls).await?;

    // Queue validated URLs to NATS
    let mut queued = 0;
    for url in &validated_urls {
        let url_hash = sha2_hash(url);
        if let Err(e) = queue::publish_scan_request(&state, url, &url_hash).await {
            tracing::warn!(url = %url, error = %e, "Failed to queue bulk scan URL");
        } else {
            queued += 1;
        }
    }

    tracing::info!(
        job_id = %job.id,
        total = validated_urls.len(),
        queued = queued,
        "Bulk scan job created"
    );

    let hydrated = hydrate_bulk_job(&state, auth_user.id, job).await?;

    Ok((StatusCode::CREATED, Json(hydrated)))
}

pub async fn get_bulk_job(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<BulkJobResponse>> {
    let job = db::get_bulk_job(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Bulk job not found".into()))?;

    // Authorization: only the job owner can view their bulk job
    if job.user_id != Some(auth_user.id) {
        return Err(AppError::NotFound("Bulk job not found".into()));
    }

    Ok(Json(hydrate_bulk_job(&state, auth_user.id, job).await?))
}

pub async fn list_bulk_jobs(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<BulkJobResponse>>> {
    let jobs = db::get_user_bulk_jobs(&state.db, auth_user.id).await?;
    let mut hydrated = Vec::with_capacity(jobs.len());
    for job in jobs {
        hydrated.push(hydrate_bulk_job(&state, auth_user.id, job).await?);
    }
    Ok(Json(hydrated))
}

async fn hydrate_bulk_job(
    state: &AppState,
    user_id: Uuid,
    job: db::BulkJob,
) -> AppResult<BulkJobResponse> {
    let normalized_urls = job
        .urls
        .iter()
        .map(|url| normalize_url(url).unwrap_or_else(|_| url.trim().to_lowercase().trim_end_matches('/').to_string()))
        .collect::<Vec<_>>();

    let latest_scans = db::get_latest_scans_for_urls(&state.db, user_id, &normalized_urls).await?;
    let scan_map = latest_scans
        .into_iter()
        .map(|scan| (scan.url.clone(), scan))
        .collect::<HashMap<_, _>>();

    let ordered_results = normalized_urls
        .iter()
        .filter_map(|url| scan_map.get(url).cloned())
        .collect::<Vec<_>>();

    let completed_urls = ordered_results.len() as i32;
    let failed_urls = job.failed_urls.min(job.total_urls.saturating_sub(completed_urls));
    let observed_total = completed_urls + failed_urls;
    let status = if observed_total >= job.total_urls && job.total_urls > 0 {
        if completed_urls > 0 { "complete" } else { "failed" }.to_string()
    } else if completed_urls > 0 || job.status == "running" {
        "running".to_string()
    } else {
        job.status.clone()
    };

    let completed_at = if status == "complete" {
        ordered_results
            .iter()
            .map(|scan| scan.scanned_at)
            .max()
            .or(job.completed_at)
    } else {
        job.completed_at
    };

    Ok(BulkJobResponse {
        id: job.id,
        user_id: job.user_id,
        status,
        total_urls: job.total_urls,
        completed_urls,
        failed_urls,
        urls: normalized_urls,
        results: (!ordered_results.is_empty()).then_some(ordered_results),
        created_at: job.created_at,
        completed_at,
    })
}

fn sha2_hash(input: &str) -> String {
    use sha2::{Digest, Sha256};
    hex::encode(Sha256::digest(input.as_bytes()))
}
