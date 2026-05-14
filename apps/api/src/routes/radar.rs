use axum::{extract::State, Extension, Json};
use serde::Deserialize;

use crate::errors::AppResult;
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct RadarQuery {
    pub event_type: Option<String>,
    pub technology: Option<String>,
    pub limit: Option<i64>,
}

pub async fn get_radar_events(
    Extension(_auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<RadarQuery>,
) -> AppResult<Json<Vec<db::RadarEvent>>> {
    let events = db::get_radar_events(
        &state.db,
        query.event_type.as_deref(),
        query.technology.as_deref(),
        query.limit.unwrap_or(50),
    )
    .await?;

    Ok(Json(events))
}
