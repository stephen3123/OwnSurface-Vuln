use axum::{extract::State, Extension, Json};

use crate::errors::AppResult;
use crate::middleware::auth::AuthUser;
use crate::models::scan_result::ScanRow;
use crate::services::db;
use crate::state::AppState;

pub async fn get_history(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(hash): axum::extract::Path<String>,
) -> AppResult<Json<Vec<ScanRow>>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let days = plan.history_days();
    let history = db::get_scan_history_within_days(&state.db, &hash, 50, days).await?;
    Ok(Json(history))
}
