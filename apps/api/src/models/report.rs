use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Report {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub url: String,
    pub title: Option<String>,
    pub scan_result: serde_json::Value,
    pub is_public: bool,
    pub slug: Option<String>,
    pub views: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReportRequest {
    pub url: String,
    pub title: Option<String>,
    pub scan_result: serde_json::Value,
    pub is_public: Option<bool>,
}
