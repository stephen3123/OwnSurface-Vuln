use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Email not verified: {0}")]
    EmailNotVerified(String),

    #[error("Rate limited")]
    RateLimited,

    #[error("Too many requests: {0}")]
    TooManyRequests(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Cache error: {0}")]
    Cache(#[from] redis::RedisError),

    #[error("Queue error: {0}")]
    Queue(String),

    #[error("Stripe error: {0}")]
    Stripe(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "forbidden", msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "conflict", msg.clone()),
            AppError::EmailNotVerified(msg) => {
                (StatusCode::UNAUTHORIZED, "email_not_verified", msg.clone())
            }
            AppError::RateLimited => (
                StatusCode::TOO_MANY_REQUESTS,
                "rate_limited",
                "Rate limit exceeded. Please upgrade your plan.".into(),
            ),
            AppError::TooManyRequests(msg) => (
                StatusCode::TOO_MANY_REQUESTS,
                "too_many_requests",
                msg.clone(),
            ),
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "An internal error occurred".into(),
                )
            }
            AppError::Database(e) => {
                tracing::error!("Database error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database_error",
                    "A database error occurred".into(),
                )
            }
            AppError::Cache(e) => {
                tracing::error!("Cache error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "cache_error",
                    "A cache error occurred".into(),
                )
            }
            AppError::Queue(msg) => {
                tracing::error!("Queue error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "queue_error",
                    format!("Queue error: {}", msg),
                )
            }
            AppError::Stripe(msg) => {
                tracing::error!("Stripe error: {}", msg);
                (StatusCode::BAD_REQUEST, "stripe_error", msg.clone())
            }
            AppError::Serialization(e) => {
                tracing::error!("Serialization error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "serialization_error",
                    format!("Failed to process data: {}", e),
                )
            }
        };

        let body = json!({
            "error": {
                "code": code,
                "message": message
            }
        });

        (status, axum::Json(body)).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
