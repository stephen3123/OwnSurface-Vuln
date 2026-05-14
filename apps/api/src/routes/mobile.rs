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

const MAX_FILE_SIZE: usize = 200 * 1024 * 1024; // 200MB

/// POST /mobile-scan — Upload APK/IPA and start a mobile security scan
pub async fn upload_and_start(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());

    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut scan_mode: String = "security_audit".to_string();
    let mut scope: serde_json::Value = serde_json::json!({});
    let mut bridge_domain: Option<String> = None;

    // Parse multipart fields
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Invalid multipart data: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "file" => {
                let fname = field
                    .file_name()
                    .unwrap_or("unknown")
                    .to_string();
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
            "scan_mode" => {
                let text = field.text().await.unwrap_or_default();
                if !["appstore_check", "security_audit", "offensive_pentest", "scan", "pentest"]
                    .contains(&text.as_str())
                {
                    return Err(AppError::BadRequest(
                        "scan_mode must be scan, pentest, appstore_check, security_audit, or offensive_pentest"
                            .into(),
                    ));
                }
                // Map new unified names to internal names for backwards compat
                scan_mode = match text.as_str() {
                    "scan" => "security_audit".to_string(),
                    "pentest" => "offensive_pentest".to_string(),
                    other => other.to_string(),
                };
            }
            "scope" => {
                let text = field.text().await.unwrap_or_default();
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                    scope = parsed;
                }
            }
            "domain" => {
                bridge_domain = Some(field.text().await.unwrap_or_default());
            }
            _ => {}
        }
    }

    let file_data =
        file_data.ok_or_else(|| AppError::BadRequest("Missing 'file' field".into()))?;
    let file_name =
        file_name.ok_or_else(|| AppError::BadRequest("Missing file name".into()))?;

    // Validate extension and determine platform
    let lower_name = file_name.to_lowercase();
    let platform = if lower_name.ends_with(".apk") {
        "android"
    } else if lower_name.ends_with(".ipa") {
        "ios"
    } else {
        return Err(AppError::BadRequest(
            "Only .apk and .ipa files are accepted".into(),
        ));
    };

    // Plan gating
    match scan_mode.as_str() {
        "appstore_check" => {
            let daily_limit = plan.appstore_checks_per_day();
            if daily_limit >= 0 {
                let used =
                    db::count_user_mobile_scans_today(&state.db, auth_user.id, "appstore_check")
                        .await?;
                if used >= daily_limit as i64 {
                    return Err(AppError::Forbidden(format!(
                        "You've used your {} App Store check(s) today.",
                        daily_limit
                    )));
                }
            }
        }
        "security_audit" | "offensive_pentest" => {
            let monthly_limit = plan.mobile_audits_per_month();
            if monthly_limit == 0 {
                return Err(AppError::Forbidden(
                    "Mobile security audits require a Pro plan. Upgrade at https://ownsurface.com/dashboard/billing".into(),
                ));
            } else if monthly_limit > 0 {
                let used =
                    db::count_user_mobile_audits_this_month(&state.db, auth_user.id).await?;
                if used >= monthly_limit as i64 {
                    return Err(AppError::Forbidden(format!(
                        "You've used your {} mobile audit(s) this month.",
                        monthly_limit
                    )));
                }
            }
        }
        _ => {}
    }

    // For offensive_pentest: require domain verification
    if scan_mode == "offensive_pentest" {
        let domain = bridge_domain.as_deref().ok_or_else(|| {
            AppError::BadRequest(
                "offensive_pentest mode requires a 'domain' field for API bridge scanning".into(),
            )
        })?;

        let verification = db::get_verified_domain(&state.db, auth_user.id, domain)
            .await?
            .ok_or_else(|| {
                AppError::Forbidden(
                    "Domain must be verified before offensive pentest mode.".into(),
                )
            })?;

        if !verification.verified {
            return Err(AppError::Forbidden(
                "Domain verification is not yet complete".into(),
            ));
        }
    }

    // Max 3 concurrent scans per user
    let running = db::get_user_mobile_scans(&state.db, auth_user.id).await?;
    let running_count = running.iter().filter(|s| s.status == "running").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent mobile scans allowed. Wait for one to complete.".into(),
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
    let scan = db::create_mobile_scan(
        &state.db,
        scan_id,
        auth_user.id,
        &file_name,
        file_size,
        &file_hash,
        platform,
        &scan_mode,
        &scope,
    )
    .await?;

    // Publish to NATS for the worker
    let payload = serde_json::json!({
        "scan_id": scan.id,
        "user_id": auth_user.id,
        "platform": platform,
        "scan_mode": scan_mode,
        "scope": scope,
        "file_path": file_path,
        "bridge_domain": bridge_domain,
    });

    state
        .nats
        .publish("mobile.request", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish mobile scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(
        scan_id = %scan.id,
        platform = %platform,
        scan_mode = %scan_mode,
        "Published mobile scan request"
    );

    Ok(Json(serde_json::json!({
        "scan": scan,
        "message": "Mobile scan started. Poll GET /mobile-scan/{id} for progress."
    })))
}

/// GET /mobile-scan/{id} — Get scan status and results
pub async fn get_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_mobile_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Mobile scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    Ok(Json(serde_json::json!({
        "scan": scan
    })))
}

/// GET /mobile-scan — List user's mobile scans
pub async fn list_scans(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let scans = db::get_user_mobile_scans(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "scans": scans
    })))
}

/// POST /mobile-scan/{id}/cancel — Cancel an in-progress scan
pub async fn cancel_scan(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scan = db::get_mobile_scan(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Mobile scan not found".into()))?;

    if scan.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your scan".into()));
    }

    if scan.status != "running" && scan.status != "pending" {
        return Err(AppError::BadRequest(
            "Only running or pending scans can be cancelled".into(),
        ));
    }

    db::update_mobile_scan_status(&state.db, id, "cancelled").await?;

    let payload = serde_json::json!({ "scan_id": id });
    if let Err(e) = state
        .nats
        .publish(
            format!("mobile.cancel.{}", id),
            payload.to_string().into(),
        )
        .await
    {
        tracing::warn!(scan_id = %id, error = %e, "Failed to publish mobile scan cancel");
    }

    Ok(Json(serde_json::json!({
        "message": "Mobile scan cancelled"
    })))
}

// ─── URL-based mobile scan (Play Store / App Store URL) ──────────────

#[derive(Debug, serde::Deserialize)]
pub struct MobileScanFromUrlRequest {
    pub store_url: String,
    #[serde(default = "default_scan_mode")]
    pub scan_mode: String,
    #[serde(default)]
    pub scope: serde_json::Value,
    pub domain: Option<String>,
}

fn default_scan_mode() -> String {
    "scan".to_string()
}

/// POST /mobile-scan/url — Scan an app by Play Store or App Store URL.
///
/// The API extracts the package ID, creates a scan record, and publishes
/// a message to NATS. The worker downloads the APK via apkpure/apkmirror
/// mirrors and runs the full mobile scan pipeline.
pub async fn scan_from_url(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<MobileScanFromUrlRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());

    // Parse store URL
    let store_url = req.store_url.trim();
    let (platform, package_id) = parse_store_url(store_url)?;

    // Validate scan mode
    let scan_mode = match req.scan_mode.as_str() {
        "scan" => "security_audit",
        "pentest" => "offensive_pentest",
        "appstore_check" | "security_audit" | "offensive_pentest" => req.scan_mode.as_str(),
        _ => {
            return Err(AppError::BadRequest(
                "scan_mode must be scan, pentest, or appstore_check".into(),
            ))
        }
    };

    // Plan gating (same as file upload)
    match scan_mode {
        "appstore_check" => {
            let daily_limit = plan.appstore_checks_per_day();
            if daily_limit >= 0 {
                let used = db::count_user_mobile_scans_today(&state.db, auth_user.id, "appstore_check").await?;
                if used >= daily_limit as i64 {
                    return Err(AppError::Forbidden(format!(
                        "You've used your {} App Store check(s) today.", daily_limit
                    )));
                }
            }
        }
        "security_audit" | "offensive_pentest" => {
            let monthly_limit = plan.mobile_audits_per_month();
            if monthly_limit == 0 {
                return Err(AppError::Forbidden(
                    "Mobile security audits require a Pro plan.".into(),
                ));
            } else if monthly_limit > 0 {
                let used = db::count_user_mobile_audits_this_month(&state.db, auth_user.id).await?;
                if used >= monthly_limit as i64 {
                    return Err(AppError::Forbidden(format!(
                        "You've used your {} mobile audit(s) this month.", monthly_limit
                    )));
                }
            }
        }
        _ => {}
    }

    // Max concurrent
    let running = db::get_user_mobile_scans(&state.db, auth_user.id).await?;
    let running_count = running.iter().filter(|s| s.status == "running" || s.status == "pending").count();
    if running_count >= 3 {
        return Err(AppError::TooManyRequests(
            "Maximum 3 concurrent mobile scans allowed.".into(),
        ));
    }

    let scan_id = Uuid::new_v4();
    let file_name = format!("{}.apk", package_id);
    let file_hash = format!("url:{}", package_id);

    // Create DB record (file_size = 0 until worker downloads it)
    let scan = db::create_mobile_scan(
        &state.db,
        scan_id,
        auth_user.id,
        &file_name,
        0, // size unknown until download
        &file_hash,
        platform,
        scan_mode,
        &req.scope,
    )
    .await?;

    // Publish to NATS — worker will download the APK
    let payload = serde_json::json!({
        "scan_id": scan.id,
        "user_id": auth_user.id,
        "platform": platform,
        "scan_mode": scan_mode,
        "scope": req.scope,
        "store_url": store_url,
        "package_id": package_id,
        "bridge_domain": req.domain,
        // file_path is null — worker will download
    });

    state
        .nats
        .publish("mobile.request", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish: {}", e)))?;

    state.nats.flush().await
        .map_err(|e| AppError::Queue(format!("Failed to flush: {}", e)))?;

    tracing::info!(
        scan_id = %scan.id,
        package_id = %package_id,
        platform = %platform,
        "Published mobile scan from store URL"
    );

    Ok(Json(serde_json::json!({
        "scan": scan,
        "package_id": package_id,
        "message": format!("Mobile scan started for {}. The APK will be downloaded automatically. Poll GET /mobile-scan/{{id}} for progress.", package_id)
    })))
}

/// Parse a Google Play Store or Apple App Store URL into (platform, package_id).
fn parse_store_url(url: &str) -> AppResult<(&'static str, String)> {
    let url_lower = url.to_lowercase();

    // Google Play Store
    // https://play.google.com/store/apps/details?id=com.whatsapp
    // play.google.com/store/apps/details?id=com.whatsapp
    if url_lower.contains("play.google.com") {
        let parsed = url::Url::parse(url)
            .or_else(|_| url::Url::parse(&format!("https://{}", url)))
            .map_err(|_| AppError::BadRequest("Invalid Play Store URL".into()))?;

        let package_id = parsed
            .query_pairs()
            .find(|(key, _)| key == "id")
            .map(|(_, value)| value.to_string())
            .ok_or_else(|| AppError::BadRequest(
                "Play Store URL must contain ?id=com.example.app parameter".into(),
            ))?;

        // Validate package ID format
        if !package_id.contains('.') || package_id.len() < 5 || package_id.len() > 150 {
            return Err(AppError::BadRequest("Invalid package ID format".into()));
        }

        return Ok(("android", package_id));
    }

    // Apple App Store
    // https://apps.apple.com/app/whatsapp-messenger/id310633997
    // https://apps.apple.com/us/app/whatsapp-messenger/id310633997
    if url_lower.contains("apps.apple.com") || url_lower.contains("itunes.apple.com") {
        let id_match = regex::Regex::new(r"/id(\d{6,12})")
            .unwrap()
            .captures(url);

        if let Some(caps) = id_match {
            let app_id = caps.get(1).unwrap().as_str().to_string();
            return Ok(("ios", app_id));
        }

        return Err(AppError::BadRequest(
            "App Store URL must contain /id{numeric_id}".into(),
        ));
    }

    Err(AppError::BadRequest(
        "URL must be a Google Play Store (play.google.com/store/apps/details?id=...) or Apple App Store (apps.apple.com/.../id...) link".into(),
    ))
}
