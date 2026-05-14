use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_public: Option<bool>,
}

pub async fn get_my_profile(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let badges = db::get_user_achievements(&state.db, user.id).await?;

    Ok(Json(json!({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "username": user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "is_public": user.is_public,
        "scan_count": user.scans_today,
        "published_count": 0,
        "follower_count": 0,
        "following_count": 0,
        "badges": badges,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    })))
}

pub async fn get_public_profile(
    State(state): State<AppState>,
    axum::extract::Path(username): axum::extract::Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let user = db::get_user_by_username(&state.db, &username)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let badges = db::get_user_achievements(&state.db, user.id).await?;
    let badge_count = badges.len();

    Ok(Json(json!({
        "id": user.id,
        "username": user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "is_public": user.is_public,
        "badge_count": badge_count,
        "created_at": user.created_at,
    })))
}

pub async fn update_profile(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<UpdateProfileRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Validate username if provided
    if let Some(ref username) = req.username {
        let trimmed = username.trim();
        if trimmed.is_empty() || trimmed.len() < 3 {
            return Err(AppError::BadRequest(
                "Username must be at least 3 characters".into(),
            ));
        }
        if trimmed.len() > 30 {
            return Err(AppError::BadRequest(
                "Username must be 30 characters or fewer".into(),
            ));
        }
        // Check uniqueness
        if let Some(existing) = db::get_user_by_username(&state.db, trimmed).await? {
            if existing.id != auth_user.id {
                return Err(AppError::BadRequest("Username is already taken".into()));
            }
        }
    }

    let updated = db::update_user_profile(
        &state.db,
        auth_user.id,
        req.username.as_deref(),
        req.bio.as_deref(),
        req.avatar_url.as_deref(),
        req.is_public,
    )
    .await?;

    Ok(Json(json!({
        "id": updated.id,
        "username": updated.username,
        "bio": updated.bio,
        "avatar_url": updated.avatar_url,
        "is_public": updated.is_public,
        "updated_at": updated.updated_at,
    })))
}

pub async fn get_user_scans(
    Extension(_auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(username): axum::extract::Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    // Verify user exists
    let _user = db::get_user_by_username(&state.db, &username)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    // Published scans feature removed — return empty for API compatibility
    Ok(Json(json!({
        "username": username,
        "scans": [],
        "count": 0,
    })))
}

pub async fn get_user_badges(
    Extension(_auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(username): axum::extract::Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let user = db::get_user_by_username(&state.db, &username)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let badges = db::get_user_achievements(&state.db, user.id).await?;

    Ok(Json(json!({
        "username": username,
        "badges": badges,
        "count": badges.len(),
    })))
}
