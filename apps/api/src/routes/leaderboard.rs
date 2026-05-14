use axum::{extract::State, Extension, Json};
use serde::Deserialize;
use serde_json::json;

use crate::errors::AppResult;
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct LeaderboardQuery {
    pub period: Option<String>, // weekly | monthly | alltime
    pub limit: Option<i64>,
}

pub async fn get_leaderboard(
    Extension(_auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<LeaderboardQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let period = query.period.as_deref().unwrap_or("weekly");
    let limit = query.limit.unwrap_or(50).clamp(1, 100);

    let entries = db::get_leaderboard(&state.db, period, limit).await?;

    Ok(Json(json!({
        "period": period,
        "entries": entries,
        "count": entries.len(),
    })))
}

pub async fn get_achievements(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let achievements = db::get_user_achievements(&state.db, auth_user.id).await?;
    let total_points = achievements.len() as i64;

    Ok(Json(json!({
        "achievements": achievements,
        "count": achievements.len(),
        "total_points": total_points,
    })))
}

pub async fn check_achievements(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let newly_awarded: Vec<crate::models::leaderboard::Achievement> =
        db::check_and_award_badges(&state.db, auth_user.id).await?;

    Ok(Json(json!({
        "newly_awarded": newly_awarded,
        "count": newly_awarded.len(),
    })))
}
