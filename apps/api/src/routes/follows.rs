use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct FollowDomainRequest {
    pub domain: String,
}

#[derive(Debug, Deserialize)]
pub struct FollowingQuery {
    pub r#type: Option<String>, // users | domains
}

#[derive(Debug, Deserialize)]
pub struct NotificationsQuery {
    pub unread_only: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct MarkReadRequest {
    pub ids: Option<Vec<Uuid>>,
}

pub async fn follow_user(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if id == auth_user.id {
        return Err(AppError::BadRequest("Cannot follow yourself".into()));
    }

    // Verify target user exists
    db::get_user_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let follow = db::create_follow_user(&state.db, auth_user.id, id).await?;

    // Create notification for the followed user (non-blocking)
    if let Err(e) = db::create_notification(
        &state.db,
        id,
        "follow",
        Some(auth_user.id),
        None,
        Some("You have a new follower"),
    )
    .await
    {
        tracing::warn!(follower = %auth_user.id, following = %id, error = %e, "Failed to create follow notification");
    }

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "following": true,
            "follow_id": follow.id,
        })),
    ))
}

pub async fn unfollow_user(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    db::delete_follow_user(&state.db, auth_user.id, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn follow_domain(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<FollowDomainRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    let domain = req.domain.trim().to_lowercase();
    if domain.is_empty() {
        return Err(AppError::BadRequest("Domain is required".into()));
    }

    let follow = db::create_follow_domain(&state.db, auth_user.id, &domain).await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "following": true,
            "follow_id": follow.id,
            "domain": domain,
        })),
    ))
}

pub async fn unfollow_domain(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<FollowDomainRequest>,
) -> AppResult<StatusCode> {
    let domain = req.domain.trim().to_lowercase();
    if domain.is_empty() {
        return Err(AppError::BadRequest("Domain is required".into()));
    }

    db::delete_follow_domain(&state.db, auth_user.id, &domain).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_following(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<FollowingQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let follow_type = query.r#type.as_deref().unwrap_or("users");

    match follow_type {
        "users" => {
            let following = db::get_following(&state.db, auth_user.id, Some("users")).await?;
            Ok(Json(json!({
                "type": "users",
                "following": following,
                "count": following.len(),
            })))
        }
        "domains" => {
            let following = db::get_following(&state.db, auth_user.id, Some("domains")).await?;
            Ok(Json(json!({
                "type": "domains",
                "following": following,
                "count": following.len(),
            })))
        }
        _ => Err(AppError::BadRequest(
            "Invalid type. Must be 'users' or 'domains'".into(),
        )),
    }
}

pub async fn list_followers(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let followers = db::get_followers(&state.db, auth_user.id).await?;

    Ok(Json(json!({
        "followers": followers,
        "count": followers.len(),
    })))
}

pub async fn list_notifications(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<NotificationsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let unread_only = query.unread_only.unwrap_or(false);

    let notifications = db::get_notifications(&state.db, auth_user.id, unread_only).await?;
    let unread_count = notifications.iter().filter(|n| !n.read).count();

    Ok(Json(json!({
        "notifications": notifications,
        "unread_count": unread_count,
    })))
}

pub async fn mark_notifications_read(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<MarkReadRequest>,
) -> AppResult<Json<serde_json::Value>> {
    match req.ids {
        Some(ref ids) if !ids.is_empty() => {
            db::mark_notifications_read(&state.db, auth_user.id, Some(ids.as_slice())).await?;
        }
        _ => {
            db::mark_notifications_read(&state.db, auth_user.id, None).await?;
        }
    };

    Ok(Json(json!({
        "updated": true,
    })))
}
