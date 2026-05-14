use axum::{extract::State, http::StatusCode, Extension, Json};
use axum::extract::Query;
use serde::Deserialize;
use sqlx;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

// ─── Request types ───

#[derive(Debug, Deserialize)]
pub struct CreateUptimeMonitorRequest {
    pub domain: String,
    pub check_interval_seconds: Option<i32>,
    pub expected_status_code: Option<i32>,
    pub alert_email: Option<bool>,
    pub alert_slack_webhook: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSslMonitorRequest {
    pub domain: String,
    pub alert_days_before_expiry: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSslMonitorRequest {
    pub alert_days: i32,
}

#[derive(Debug, Deserialize)]
pub struct TriggerSpeedMeasurementRequest {
    pub domain: String,
    pub url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScheduledReportRequest {
    pub domain: String,
    pub report_type: Option<String>,
    pub include_uptime: Option<bool>,
    pub include_ssl: Option<bool>,
    pub include_speed: Option<bool>,
    pub include_security: Option<bool>,
    pub recipients: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SpeedHistoryQuery {
    pub limit: Option<i64>,
}

// ─── Uptime Monitor Endpoints ───

/// POST /monitors/uptime — Create uptime monitor (Free: 1, Pro: unlimited)
pub async fn create_uptime_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateUptimeMonitorRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max = plan.max_uptime_monitors();
    if max >= 0 {
        let current = db::count_user_uptime_monitors(&state.db, auth_user.id).await?;
        if current >= max as i64 {
            return Err(AppError::Forbidden(format!(
                "Your plan allows {} uptime monitor(s). Upgrade to Pro for unlimited.",
                max
            )));
        }
    }

    let domain = req.domain.trim().to_lowercase();

    // Domain must be verified
    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden("Domain must be verified before creating a monitor".into())
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification not complete".into(),
        ));
    }

    let interval = req.check_interval_seconds.unwrap_or(300).max(60).min(3600);

    let monitor =
        db::create_uptime_monitor(&state.db, auth_user.id, &domain, verification.id, interval)
            .await?;

    // Trigger an initial check immediately
    let payload = serde_json::json!({
        "monitor_id": monitor.id,
        "domain": domain,
    });
    if let Err(e) = state
        .nats
        .publish("monitor.uptime.check", payload.to_string().into())
        .await
    {
        tracing::warn!(monitor_id = %monitor.id, error = %e, "Failed to trigger initial uptime check");
    }
    if let Err(e) = state.nats.flush().await {
        tracing::warn!(monitor_id = %monitor.id, error = %e, "Failed to flush NATS after uptime check trigger");
    }

    Ok(Json(serde_json::json!({
        "monitor": monitor
    })))
}

/// GET /monitors/uptime — List uptime monitors
pub async fn list_uptime_monitors(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let monitors = db::get_uptime_monitors(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "monitors": monitors
    })))
}

/// GET /monitors/uptime/{id} — Get monitor with recent checks
pub async fn get_uptime_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let monitor = db::get_uptime_monitor(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Monitor not found".into()))?;

    if monitor.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your monitor".into()));
    }

    let checks = db::get_uptime_checks(&state.db, id, 100).await?;

    // Calculate uptime percentage from recent checks
    let total = checks.len() as f64;
    let up_count = checks
        .iter()
        .filter(|c| c.status_code.map_or(false, |s| (200..400).contains(&s)))
        .count() as f64;
    let uptime_pct = if total > 0.0 {
        (up_count / total) * 100.0
    } else {
        100.0
    };

    let avg_response_ms = if !checks.is_empty() {
        let sum: i64 = checks
            .iter()
            .filter_map(|c| c.response_time_ms.map(|v| v as i64))
            .sum();
        let count = checks
            .iter()
            .filter(|c| c.response_time_ms.is_some())
            .count() as i64;
        if count > 0 {
            sum / count
        } else {
            0
        }
    } else {
        0
    };

    Ok(Json(serde_json::json!({
        "monitor": monitor,
        "checks": checks,
        "stats": {
            "uptime_percentage": uptime_pct,
            "avg_response_ms": avg_response_ms,
            "total_checks": checks.len()
        }
    })))
}

/// DELETE /monitors/uptime/{id} — Delete uptime monitor
pub async fn delete_uptime_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    let monitor = db::get_uptime_monitor(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Monitor not found".into()))?;

    if monitor.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your monitor".into()));
    }

    db::delete_uptime_monitor(&state.db, id, auth_user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── SSL Monitor Endpoints ───

/// POST /monitors/ssl — Create SSL monitor (Free: 1, Pro: unlimited)
pub async fn create_ssl_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateSslMonitorRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max = plan.max_ssl_monitors();
    if max >= 0 {
        let current = db::count_user_ssl_monitors(&state.db, auth_user.id).await?;
        if current >= max as i64 {
            return Err(AppError::Forbidden(format!(
                "Your plan allows {} SSL monitor(s). Upgrade to Pro for unlimited.",
                max
            )));
        }
    }

    let domain = req.domain.trim().to_lowercase();

    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden("Domain must be verified before creating an SSL monitor".into())
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification not complete".into(),
        ));
    }

    let alert_days_val = req.alert_days_before_expiry.unwrap_or(30).max(1).min(90);

    let monitor = db::create_ssl_monitor(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        alert_days_val,
    )
    .await?;

    // Trigger an immediate check
    let payload = serde_json::json!({
        "monitor_id": monitor.id,
        "domain": domain,
    });
    if let Err(e) = state
        .nats
        .publish("monitor.ssl.check", payload.to_string().into())
        .await
    {
        tracing::warn!(monitor_id = %monitor.id, error = %e, "Failed to trigger initial SSL check");
    }
    if let Err(e) = state.nats.flush().await {
        tracing::warn!(monitor_id = %monitor.id, error = %e, "Failed to flush NATS after SSL check trigger");
    }

    Ok(Json(serde_json::json!({
        "monitor": monitor
    })))
}

/// GET /monitors/ssl — List SSL monitors
pub async fn list_ssl_monitors(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let monitors = db::get_ssl_monitors(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "monitors": monitors
    })))
}

/// DELETE /monitors/ssl/{id} — Delete SSL monitor
pub async fn delete_ssl_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    let monitor = db::get_ssl_monitor(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Monitor not found".into()))?;

    if monitor.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your monitor".into()));
    }

    db::delete_ssl_monitor(&state.db, id, auth_user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// PUT /monitors/ssl/{id} — Update SSL monitor settings
pub async fn update_ssl_monitor(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<UpdateSslMonitorRequest>,
) -> AppResult<StatusCode> {
    let monitor = db::get_ssl_monitor(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Monitor not found".into()))?;

    if monitor.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your monitor".into()));
    }

    db::update_ssl_monitor_alert_days(&state.db, id, auth_user.id, req.alert_days).await?;
    Ok(StatusCode::OK)
}

// ─── Speed Measurement Endpoints ───

/// POST /monitors/speed — Trigger a speed measurement (Pro only)
pub async fn trigger_speed_measurement(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<TriggerSpeedMeasurementRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_speed_monitoring() {
        return Err(AppError::Forbidden(
            "Speed monitoring requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();

    // Domain must be verified for speed measurements
    let _verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden("Domain must be verified before measuring speed".into())
        })?;

    let url = req.url.unwrap_or_else(|| format!("https://{}", domain));

    let payload = serde_json::json!({
        "domain": domain,
        "url": url,
        "user_id": auth_user.id,
    });

    state
        .nats
        .publish("monitor.speed.measure", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish speed measurement: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    Ok(Json(serde_json::json!({
        "message": "Speed measurement queued. Results will be available via GET /monitors/speed/{domain}.",
        "domain": domain,
        "url": url
    })))
}

/// GET /monitors/speed/{id_or_domain}/history — Get speed measurement history
pub async fn get_speed_history(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id_or_domain): axum::extract::Path<String>,
    axum::extract::Query(query): axum::extract::Query<SpeedHistoryQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let limit = query.limit.unwrap_or(30).min(100);

    // If ID is provided, find the domain first
    let domain = if let Ok(id) = Uuid::parse_str(&id_or_domain) {
        if let Some(m) = db::get_speed_measurement(&state.db, id).await? {
            if m.user_id != auth_user.id {
                return Err(AppError::Forbidden("Not your tracker".into()));
            }
            m.domain
        } else {
            return Err(AppError::NotFound("Tracker not found".into()));
        }
    } else {
        id_or_domain
    };

    let measurements = db::get_speed_measurements(&state.db, &domain, limit).await?;

    // Create a friendlier format for the chart (flattened)
    let chart_data: Vec<serde_json::Value> = measurements
        .iter()
        .map(|m| {
            serde_json::json!({
                "timestamp": m.measured_at,
                "lcp": m.lcp_ms.unwrap_or(0.0),
                "cls": m.cls.unwrap_or(0.0),
                "ttfb": m.ttfb_ms.unwrap_or(0.0),
                "id": m.id
            })
        })
        .collect();

    // Calculate averages if we have data
    let stats = if !measurements.is_empty() {
        let count = measurements.len() as f64;
        let avg_lcp: f64 = measurements.iter().filter_map(|m| m.lcp_ms).sum::<f64>() / count;
        let avg_cls: f64 = measurements.iter().filter_map(|m| m.cls).sum::<f64>() / count;
        let avg_ttfb: f64 = measurements.iter().filter_map(|m| m.ttfb_ms).sum::<f64>() / count;

        serde_json::json!({
            "avg_lcp_ms": avg_lcp,
            "avg_cls": avg_cls,
            "avg_ttfb_ms": avg_ttfb,
            "total_measurements": measurements.len()
        })
    } else {
        serde_json::json!({
            "message": "No measurements yet"
        })
    };

    Ok(Json(serde_json::json!({
        "measurements": measurements,
        "history": chart_data,
        "stats": stats
    })))
}

/// DELETE /monitors/speed/{id_or_domain} — Delete speed tracker/history
pub async fn delete_speed_tracker(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id_or_domain): axum::extract::Path<String>,
) -> AppResult<StatusCode> {
    // Try to parse as UUID first
    if let Ok(id) = Uuid::parse_str(&id_or_domain) {
        // Find the measurement to get the domain
        if let Some(m) = db::get_speed_measurement(&state.db, id).await? {
            if m.user_id != auth_user.id {
                return Err(AppError::Forbidden("Not your measurement".into()));
            }
            // Delete all measurements for this domain (treating it as a "tracker")
            db::delete_speed_measurements_by_domain(&state.db, &m.domain, auth_user.id).await?;
        }
    } else {
        // Treat as domain
        db::delete_speed_measurements_by_domain(&state.db, &id_or_domain, auth_user.id).await?;
    }

    Ok(StatusCode::NO_CONTENT)
}

/// POST /monitors/speed/{id}/measure — Trigger a new measurement for an existing tracker
pub async fn trigger_speed_measurement_by_id(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let m = db::get_speed_measurement(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Tracker not found".into()))?;

    if m.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your tracker".into()));
    }

    // Reuse trigger logic
    let payload = serde_json::json!({
        "domain": m.domain,
        "url": m.url,
        "user_id": auth_user.id,
    });

    state
        .nats
        .publish("monitor.speed.measure", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish speed measurement: {}", e)))?;

    state.nats.flush().await.map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    Ok(Json(serde_json::json!({
        "message": "Speed measurement queued",
        "id": id,
        "domain": m.domain,
        "url": m.url
    })))
}

// ─── Scheduled Report Endpoints ───

/// POST /monitors/reports — Create a scheduled report (Pro only)
pub async fn create_scheduled_report(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateScheduledReportRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    if !plan.has_scheduled_reports() {
        return Err(AppError::Forbidden(
            "Scheduled reports require Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let domain = req.domain.trim().to_lowercase();

    let verification = db::get_verified_domain(&state.db, auth_user.id, &domain)
        .await?
        .ok_or_else(|| {
            AppError::Forbidden("Domain must be verified before creating scheduled reports".into())
        })?;

    if !verification.verified {
        return Err(AppError::Forbidden(
            "Domain verification not complete".into(),
        ));
    }

    let report_type = match req.report_type.as_deref() {
        Some("daily") | Some("weekly") | Some("monthly") => req.report_type.clone().unwrap(),
        Some(_) => {
            return Err(AppError::BadRequest(
                "report_type must be 'daily', 'weekly', or 'monthly'".into(),
            ))
        }
        None => "weekly".to_string(),
    };

    if req.recipients.is_empty() {
        return Err(AppError::BadRequest(
            "At least one recipient email is required".into(),
        ));
    }

    // Calculate next_send_at based on report_type
    let now = chrono::Utc::now();
    let next_send_at = match report_type.as_str() {
        "daily" => now + chrono::Duration::days(1),
        "weekly" => now + chrono::Duration::weeks(1),
        "monthly" => now + chrono::Duration::days(30),
        _ => now + chrono::Duration::weeks(1),
    };

    let report = db::create_scheduled_report(
        &state.db,
        auth_user.id,
        &domain,
        verification.id,
        &report_type,
        &req.recipients,
    )
    .await?;

    Ok(Json(serde_json::json!({
        "report": report
    })))
}

/// GET /monitors/reports — List scheduled reports
pub async fn list_scheduled_reports(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let reports = db::get_scheduled_reports(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "reports": reports
    })))
}

// ─── Security Badge (Public) ───

/// GET /badge/{domain}.svg — Public embeddable security badge
pub async fn get_security_badge(
    State(state): State<AppState>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<axum::response::Response> {
    use axum::response::IntoResponse;

    // Strip .svg suffix if present (already handled by route pattern, but be safe)
    let domain = domain.trim_end_matches(".svg").to_lowercase();

    // Look up the most recent scan for this domain
    let scan = db::get_scan_by_domain(&state.db, &domain).await?;

    let (grade, color) = match scan {
        Some(s) => {
            // Extract security grade from scan result
            let grade = s
                .result
                .get("security")
                .and_then(|sec| sec.get("grade"))
                .and_then(|g| g.as_str())
                .unwrap_or("?")
                .to_string();
            let color = match grade.as_str() {
                "A+" | "A" => "#4c1",
                "B" => "#a3c51c",
                "C" => "#dfb317",
                "D" => "#fe7d37",
                "F" => "#e05d44",
                _ => "#9f9f9f",
            };
            (grade, color)
        }
        None => ("?".to_string(), "#9f9f9f"),
    };

    let svg = format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" width="110" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a"><rect width="110" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h70v20H0z"/>
    <path fill="{color}" d="M70 0h40v20H70z"/>
    <path fill="url(#b)" d="M0 0h110v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="35" y="15" fill="#010101" fill-opacity=".3">XrayAI</text>
    <text x="35" y="14">XrayAI</text>
    <text x="90" y="15" fill="#010101" fill-opacity=".3">{grade}</text>
    <text x="90" y="14">{grade}</text>
  </g>
</svg>"##,
        color = color,
        grade = grade,
    );

    Ok((
        StatusCode::OK,
        [
            (axum::http::header::CONTENT_TYPE, "image/svg+xml"),
            (axum::http::header::CACHE_CONTROL, "public, max-age=3600"),
        ],
        svg,
    )
        .into_response())
}

// ─── Summary & Alerts ───

/// GET /monitoring/summary — Aggregate monitor counts
pub async fn get_monitoring_summary(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let uptime_monitors = db::get_uptime_monitors(&state.db, auth_user.id).await.unwrap_or_default();
    let ssl_monitors = db::get_ssl_monitors(&state.db, auth_user.id).await.unwrap_or_default();
    // Speed monitors don't have a list function yet — count from speed_measurements table
    let speed_count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT domain) FROM speed_measurements WHERE user_id = $1"
    )
    .bind(auth_user.id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0));
    let speed_count = speed_count.unwrap_or(0);

    let uptime_up = uptime_monitors.iter().filter(|m| {
        m.last_status.as_deref().map_or(true, |s| s == "up" || s == "200")
    }).count();
    let uptime_down = uptime_monitors.len() - uptime_up;

    let ssl_healthy = ssl_monitors.iter().filter(|m| {
        m.is_valid.unwrap_or(true)
    }).count();
    let ssl_expiring = ssl_monitors.len() - ssl_healthy;

    Ok(Json(serde_json::json!({
        "uptime": {
            "total": uptime_monitors.len(),
            "up": uptime_up,
            "down": uptime_down
        },
        "ssl": {
            "total": ssl_monitors.len(),
            "healthy": ssl_healthy,
            "expiring": ssl_expiring
        },
        "speed": {
            "total": speed_count,
            "tracked": speed_count
        }
    })))
}

#[derive(Debug, Deserialize)]
pub struct AlertsQuery {
    pub limit: Option<i64>,
}

/// GET /monitoring/alerts — Recent monitoring alerts
pub async fn get_monitoring_alerts(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Query(query): Query<AlertsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let limit = query.limit.unwrap_or(10).min(50);
    let mut alerts: Vec<serde_json::Value> = Vec::new();

    // Check uptime monitors for down status
    if let Ok(monitors) = db::get_uptime_monitors(&state.db, auth_user.id).await {
        for m in &monitors {
            if m.last_status.as_deref().map_or(false, |s| s != "up" && s != "200") {
                alerts.push(serde_json::json!({
                    "id": m.id,
                    "type": "uptime",
                    "severity": "critical",
                    "domain": m.domain,
                    "message": format!("{} is down (status: {})", m.domain, m.last_status.as_deref().unwrap_or("unknown")),
                    "created_at": m.last_checked_at
                }));
            }
        }
    }

    // Check SSL monitors for expiring certs
    if let Ok(monitors) = db::get_ssl_monitors(&state.db, auth_user.id).await {
        for m in &monitors {
            if let Some(valid_to) = m.valid_to {
                let days_left = (valid_to - chrono::Utc::now()).num_days();
                if days_left < 0 {
                    alerts.push(serde_json::json!({
                        "id": m.id,
                        "type": "ssl",
                        "severity": "critical",
                        "domain": m.domain,
                        "message": format!("SSL certificate for {} has expired", m.domain),
                        "created_at": m.last_checked_at
                    }));
                } else if days_left < m.alert_days_before_expiry as i64 {
                    alerts.push(serde_json::json!({
                        "id": m.id,
                        "type": "ssl",
                        "severity": "warning",
                        "domain": m.domain,
                        "message": format!("SSL certificate for {} expires in {} days", m.domain, days_left),
                        "created_at": m.last_checked_at
                    }));
                }
            }
        }
    }

    // Sort by severity (critical first) and limit
    alerts.sort_by(|a, b| {
        let sev_a = if a["severity"] == "critical" { 0 } else { 1 };
        let sev_b = if b["severity"] == "critical" { 0 } else { 1 };
        sev_a.cmp(&sev_b)
    });
    alerts.truncate(limit as usize);

    Ok(Json(serde_json::json!(alerts)))
}
