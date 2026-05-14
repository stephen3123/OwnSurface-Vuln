mod config;
mod errors;
mod metrics;
mod middleware;
mod models;
mod routes;
mod services;
mod state;

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load .env file
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "xrayai_api=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = config::Config::from_env();
    let port = config.port;

    tracing::info!("Starting XrayAI API server on port {}", port);

    // Build application state
    let state = state::AppState::new(config.clone()).await?;

    tracing::info!("Connected to PostgreSQL, Dragonfly, and NATS");

    // Build router with CORS
    let cors = middleware::cors::cors_layer(&config);

    let app = routes::create_router(state)
        .layer(axum::middleware::from_fn(
            middleware::security_headers::security_headers_middleware,
        ))
        .layer(cors)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(axum::extract::DefaultBodyLimit::max(200 * 1024 * 1024)); // 200MB for APK/IPA uploads

    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("XrayAI API listening on 0.0.0.0:{}", port);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await?;

    Ok(())
}