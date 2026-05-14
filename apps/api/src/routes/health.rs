use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde_json::{json, Value};

use crate::state::AppState;

pub async fn health_check(State(state): State<AppState>) -> Json<Value> {
    let db_ok = sqlx::query("SELECT 1").fetch_one(&state.db).await.is_ok();

    let cache_ok = {
        let mut conn = state.redis.get_multiplexed_async_connection().await;
        match &mut conn {
            Ok(c) => redis::cmd("PING").query_async::<String>(c).await.is_ok(),
            Err(_) => false,
        }
    };

    let nats_ok = state.nats.publish("health.ping", "ok".into()).await.is_ok();

    let status = if db_ok && cache_ok && nats_ok {
        "healthy"
    } else {
        "degraded"
    };

    Json(json!({
        "status": status,
        "services": {
            "database": if db_ok { "up" } else { "down" },
            "cache": if cache_ok { "up" } else { "down" },
            "queue": if nats_ok { "up" } else { "down" }
        },
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn mcp_manifest() -> Json<Value> {
    Json(crate::services::mcp::mcp_manifest())
}

pub async fn api_root() -> Json<Value> {
    Json(json!({
        "name": "OwnSurface API",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Website intelligence platform — tech stack, security, SEO, company data, carbon footprint from any URL.",
        "docs": "https://ownsurface.com/developers",
        "endpoints": {
            "health": "/health",
            "scan": "POST /api/v1/scan",
            "enrich": "GET /api/v1/enrich/{domain}",
            "mcp": "/api/v1/mcp"
        },
        "links": {
            "dashboard": "https://ownsurface.com",
            "pricing": "https://ownsurface.com/pricing",
            "mcp_server": "npx @ownsurface/mcp-server"
        }
    }))
}

/// Prometheus-compatible metrics endpoint.
/// Protected by METRICS_TOKEN env var in production. If not set, metrics are public
/// (suitable for development). In production, set METRICS_TOKEN and configure
/// Prometheus to send `Authorization: Bearer <token>`.
pub async fn prometheus_metrics(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> impl IntoResponse {
    if let Ok(expected_token) = std::env::var("METRICS_TOKEN") {
        if !expected_token.is_empty() {
            let provided = headers
                .get(header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "));

            match provided {
                Some(token) if token == expected_token => {}
                _ => {
                    return (
                        StatusCode::UNAUTHORIZED,
                        [(
                            header::CONTENT_TYPE,
                            "text/plain; version=0.0.4; charset=utf-8",
                        )],
                        "Unauthorized".to_string(),
                    );
                }
            }
        }
    }

    let mut body = crate::metrics::get_metrics_text();

    // Database pool metrics
    let pool_size = state.db.size();
    let pool_idle = state.db.num_idle();
    body.push_str(&format!(
        "\
# HELP db_pool_size Current number of connections in the pool
# TYPE db_pool_size gauge
db_pool_size {pool_size}

# HELP db_pool_idle Current number of idle connections
# TYPE db_pool_idle gauge
db_pool_idle {pool_idle}
"
    ));

    // Cache connectivity probe
    let cache_up: i32 = {
        let mut conn = state.redis.get_multiplexed_async_connection().await;
        match &mut conn {
            Ok(c) => {
                if redis::cmd("PING").query_async::<String>(c).await.is_ok() {
                    1
                } else {
                    0
                }
            }
            Err(_) => 0,
        }
    };
    body.push_str(&format!(
        "\
# HELP cache_up Whether the cache (Dragonfly/Redis) is reachable
# TYPE cache_up gauge
cache_up {cache_up}
"
    ));

    (
        StatusCode::OK,
        [(
            header::CONTENT_TYPE,
            "text/plain; version=0.0.4; charset=utf-8",
        )],
        body,
    )
}
