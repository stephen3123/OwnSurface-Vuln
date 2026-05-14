use axum::{
    extract::{Multipart, State},
    Extension, Json,
};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

const MAX_FILE_SIZE: usize = 50 * 1024 * 1024; // 50MB (extensions are small)

/// POST /extension-scan — Upload a Chrome extension (.crx/.zip) and scan it
pub async fn upload_and_start(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());

    // Plan gating: Free gets 3/day, Pro unlimited
    let daily_limit = plan.extension_scans_per_day();
    if daily_limit >= 0 {
        let used = db::count_user_extension_scans_today(&state.db, auth_user.id).await?;
        if used >= daily_limit as i64 {
            return Err(AppError::Forbidden(format!(
                "You've used your {} extension scan(s) today.",
                daily_limit
            )));
        }
    }

    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Invalid multipart data: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" {
            let fname = field.file_name().unwrap_or("unknown").to_string();
            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to read file: {}", e)))?;

            if data.len() > MAX_FILE_SIZE {
                return Err(AppError::BadRequest(format!(
                    "File exceeds maximum size of {}MB",
                    MAX_FILE_SIZE / (1024 * 1024)
                )));
            }

            file_name = Some(fname);
            file_data = Some(data.to_vec());
        }
    }

    let file_data =
        file_data.ok_or_else(|| AppError::BadRequest("Missing 'file' field".into()))?;
    let file_name =
        file_name.ok_or_else(|| AppError::BadRequest("Missing file name".into()))?;

    // Validate extension
    let lower_name = file_name.to_lowercase();
    if !lower_name.ends_with(".crx") && !lower_name.ends_with(".zip") {
        return Err(AppError::BadRequest(
            "Only .crx and .zip files are accepted for extension scanning".into(),
        ));
    }

    // Max 3 concurrent scans per user
    let running = db::get_user_extension_scans(&state.db, auth_user.id).await?;
    let running_count = running.iter().filter(|s| s.status == "running").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent extension scans allowed.".into(),
        ));
    }

    // Compute SHA-256 hash
    let mut hasher = Sha256::new();
    hasher.update(&file_data);
    let file_hash = format!("{:x}", hasher.finalize());
    let file_size = file_data.len() as i64;

    // Save file to staging directory
    let staging_dir =
        std::env::var("MOBILE_STAGING_DIR").unwrap_or_else(|_| "/tmp/ownsurface-mobile".into());
    let scan_id = Uuid::new_v4();
    let scan_dir = format!("{}/{}", staging_dir, scan_id);
    tokio::fs::create_dir_all(&scan_dir)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create staging dir: {}", e)))?;

    let file_path = format!("{}/{}", scan_dir, file_name);
    tokio::fs::write(&file_path, &file_data)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to write file: {}", e)))?;

    // Create DB record
    let scan = db::create_extension_scan(
        &state.db,
        scan_id,
        auth_user.id,
        &file_name,
        file_size,
        &file_hash,
    )
    .await?;

    // Publish to NATS
    let payload = serde_json::json!({
        "scan_id": scan.id,
        "user_id": auth_user.id,
        "file_path": file_path,
    });

    state
        .nats
        .publish("extension.request", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish extension scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(scan_id = %scan.id, "Published extension scan request");

    Ok(Json(serde_json::json!({
        "scan": scan,
        "message": "Extension scan started. Poll GET /extension-scan/{id} for progress."
    })))
}

/// GET /extension-scan/{id}
pub async fn get_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_extension_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Extension scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    Ok(Json(serde_json::json!({ "scan": scan })))
}

/// GET /extension-scan
pub async fn list_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_extension_scans(&state.db, auth_user.id).await?;
    Ok(Json(serde_json::json!({ "scans": scans })))
}

/// POST /extension-scan/{id}/cancel
pub async fn cancel_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_extension_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Extension scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    db::update_extension_scan_status(&state.db, id, "cancelled").await?;

    let payload = serde_json::json!({ "scan_id": id });
    if let Err(e) = state
        .nats
        .publish(format!("extension.cancel.{}", id), payload.to_string().into())
        .await
    {
        tracing::warn!(scan_id = %id, error = %e, "Failed to publish extension scan cancel");
    }

    Ok(Json(serde_json::json!({ "message": "Extension scan cancelled" })))
}
