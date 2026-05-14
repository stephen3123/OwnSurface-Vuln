use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use redis::AsyncCommands;

use crate::errors::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::user::Plan;
use crate::state::AppState;

pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Only rate-limit scan-creation requests (POST /api/v1/scan and POST /api/v1/bulk)
    let is_scan_request = request.method() == axum::http::Method::POST
        && (request.uri().path() == "/api/v1/scan" || request.uri().path() == "/api/v1/bulk");

    if is_scan_request {
        if let Some(auth_user) = request.extensions().get::<AuthUser>() {
            let plan = Plan::from(auth_user.plan.clone());
            let limit = plan.scans_per_day();

            // Use per-API-key counter when authenticated via API key,
            // otherwise use per-user counter (JWT/session)
            let redis_key = match auth_user.api_key_id {
                Some(key_id) => format!("rate_limit:apikey:{}:{}", key_id, today_key()),
                None => format!("rate_limit:{}:{}", auth_user.id, today_key()),
            };

            let mut conn = state
                .redis
                .get_multiplexed_async_connection()
                .await
                .map_err(|e| AppError::Cache(e))?;

            // Enforce limit only for non-unlimited plans
            if limit >= 0 {
                let count: i64 = conn.get(&redis_key).await.unwrap_or(0);
                if count >= limit as i64 {
                    return Err(AppError::RateLimited);
                }
            }

            // Always increment counter (for tracking scans_today even on unlimited plans)
            let (new_count,): (i64,) = redis::pipe()
                .atomic()
                .incr(&redis_key, 1i64)
                .expire(&redis_key, 86400)
                .ignore()
                .query_async(&mut conn)
                .await
                .map_err(|e| AppError::Cache(e))?;

            // Also increment the user-level counter when using API key
            // so that /me endpoint scans_today stays accurate
            if auth_user.api_key_id.is_some() {
                let user_key = format!("rate_limit:{}:{}", auth_user.id, today_key());
                let _: () = redis::pipe()
                    .atomic()
                    .incr(&user_key, 1i64)
                    .expire(&user_key, 86400)
                    .query_async(&mut conn)
                    .await
                    .map_err(|e| AppError::Cache(e))?;
            }

            let mut response = next.run(request).await;
            let headers = response.headers_mut();
            if limit >= 0 {
                headers.insert("x-ratelimit-limit", limit.to_string().parse().unwrap());
                headers.insert(
                    "x-ratelimit-remaining",
                    std::cmp::max(0, limit as i64 - new_count)
                        .to_string()
                        .parse()
                        .unwrap(),
                );
            }
            let seconds_until_midnight = seconds_until_utc_midnight();
            headers.insert(
                "x-ratelimit-reset",
                seconds_until_midnight.to_string().parse().unwrap(),
            );
            return Ok(response);
        }
    }

    Ok(next.run(request).await)
}

fn today_key() -> String {
    chrono::Utc::now().format("%Y-%m-%d").to_string()
}

fn seconds_until_utc_midnight() -> i64 {
    let now = chrono::Utc::now();
    let tomorrow = (now + chrono::Duration::days(1)).date_naive().and_hms_opt(0, 0, 0).unwrap();
    let tomorrow_utc = tomorrow.and_utc();
    (tomorrow_utc - now).num_seconds()
}
