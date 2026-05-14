use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// --- Database Models ---

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Follow {
    pub id: Uuid,
    pub follower_id: Uuid,
    pub following_id: Option<Uuid>,
    pub following_domain: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub notification_type: String,
    pub actor_id: Option<Uuid>,
    pub target_id: Option<Uuid>,
    pub content: Option<String>,
    pub read: bool,
    pub created_at: DateTime<Utc>,
}

// --- Request Structs ---

#[derive(Debug, Deserialize)]
pub struct FollowUserRequest {
    pub user_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct FollowDomainRequest {
    pub domain: String,
}

#[derive(Debug, Deserialize)]
pub struct NotificationQuery {
    pub unread_only: Option<bool>,
    pub cursor: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct MarkNotificationsReadRequest {
    pub notification_ids: Vec<Uuid>,
}

// --- Response Structs ---

#[derive(Debug, Serialize)]
pub struct FollowResponse {
    pub following: bool,
}

#[derive(Debug, Serialize)]
pub struct FollowerInfo {
    pub user_id: Uuid,
    pub username: Option<String>,
    pub avatar_url: Option<String>,
    pub followed_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FollowingInfo {
    pub user_id: Option<Uuid>,
    pub domain: Option<String>,
    pub username: Option<String>,
    pub avatar_url: Option<String>,
    pub followed_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FollowListResponse {
    pub items: Vec<FollowerInfo>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct FollowingListResponse {
    pub items: Vec<FollowingInfo>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct NotificationResponse {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub actor_id: Option<Uuid>,
    pub actor_username: Option<String>,
    pub actor_avatar_url: Option<String>,
    pub target_id: Option<Uuid>,
    pub content: Option<String>,
    pub read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct NotificationListResponse {
    pub items: Vec<NotificationResponse>,
    pub unread_count: i64,
    pub next_cursor: Option<DateTime<Utc>>,
    pub has_more: bool,
}
