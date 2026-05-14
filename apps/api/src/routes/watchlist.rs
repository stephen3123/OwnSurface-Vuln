use axum::{extract::State, Extension, Json};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::watchlist::*;
use crate::services::db;
use crate::state::AppState;

pub async fn create_watchlist(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateWatchlistRequest>,
) -> AppResult<Json<Watchlist>> {
    if req.urls.is_empty() {
        return Err(AppError::BadRequest("At least one URL is required".into()));
    }

    // Enforce watchlist limits per plan
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max_wl = plan.max_watchlists();
    if max_wl >= 0 {
        let existing = db::get_watchlists(&state.db, auth_user.id).await?;
        if existing.len() >= max_wl as usize {
            return Err(AppError::Forbidden(format!(
                "Free plan allows {} watchlist(s). Upgrade to Pro for unlimited.",
                max_wl
            )));
        }
    }

    let max_urls = plan.max_watchlist_urls();
    if max_urls >= 0 && req.urls.len() > max_urls as usize {
        return Err(AppError::Forbidden(format!(
            "Free plan allows {} URLs per watchlist. Upgrade to Pro for unlimited.",
            max_urls
        )));
    }

    let wl = db::create_watchlist(
        &state.db,
        auth_user.id,
        &req.name,
        &req.urls,
        req.check_interval.unwrap_or(6),
        req.alert_email.unwrap_or(true),
        req.alert_slack_webhook.as_deref(),
    )
    .await?;

    Ok(Json(wl))
}

pub async fn list_watchlists(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<Watchlist>>> {
    let wls = db::get_watchlists(&state.db, auth_user.id).await?;
    Ok(Json(wls))
}

pub async fn get_watchlist(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let wl = db::get_watchlist_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Watchlist not found".into()))?;

    if wl.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your watchlist".into()));
    }

    let changes = db::get_watchlist_changes(&state.db, id, 50).await?;

    Ok(Json(serde_json::json!({
        "watchlist": wl,
        "changes": changes
    })))
}

pub async fn update_watchlist(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<UpdateWatchlistRequest>,
) -> AppResult<Json<Watchlist>> {
    let existing = db::get_watchlist_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Watchlist not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your watchlist".into()));
    }

    let wl = db::update_watchlist(
        &state.db,
        id,
        req.name.as_deref(),
        req.urls.as_deref(),
        req.check_interval,
        req.alert_email,
    )
    .await?;

    Ok(Json(wl))
}

pub async fn delete_watchlist(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    let existing = db::get_watchlist_by_id(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Watchlist not found".into()))?;

    if existing.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your watchlist".into()));
    }

    db::delete_watchlist(&state.db, id).await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}
