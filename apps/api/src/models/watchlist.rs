use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Watchlist {
    pub id: Uuid,
    pub user_id: Uuid,
    pub team_id: Option<Uuid>,
    pub name: String,
    pub urls: Vec<String>,
    pub check_interval: i32,
    pub alert_email: bool,
    pub alert_slack_webhook: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWatchlistRequest {
    pub name: String,
    pub urls: Vec<String>,
    pub check_interval: Option<i32>,
    pub alert_email: Option<bool>,
    pub alert_slack_webhook: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWatchlistRequest {
    pub name: Option<String>,
    pub urls: Option<Vec<String>>,
    pub check_interval: Option<i32>,
    pub alert_email: Option<bool>,
    pub alert_slack_webhook: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WatchlistChange {
    pub id: Uuid,
    pub watchlist_id: Uuid,
    pub url: String,
    pub change_type: String,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
    pub detected_at: DateTime<Utc>,
}
