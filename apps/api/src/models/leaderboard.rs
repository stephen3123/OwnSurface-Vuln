use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// --- Database Models ---

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserStats {
    pub user_id: Uuid,
    pub total_scans: i32,
    pub total_published: i32,
    pub total_likes_received: i32,
    pub total_followers: i32,
    pub weekly_scans: i32,
    pub weekly_reset_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Achievement {
    pub id: Uuid,
    pub user_id: Uuid,
    pub badge_id: String,
    pub earned_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Badge {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub category: String,
    pub criteria: serde_json::Value,
}

// --- Request Structs ---

#[derive(Debug, Deserialize)]
pub struct LeaderboardQuery {
    pub period: Option<LeaderboardPeriod>,
    pub metric: Option<LeaderboardMetric>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum LeaderboardPeriod {
    Weekly,
    AllTime,
}

impl Default for LeaderboardPeriod {
    fn default() -> Self {
        Self::Weekly
    }
}

#[derive(Debug, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum LeaderboardMetric {
    Scans,
    Published,
    Likes,
    Followers,
}

impl Default for LeaderboardMetric {
    fn default() -> Self {
        Self::Scans
    }
}

// --- Response Structs ---

#[derive(Debug, Serialize)]
pub struct LeaderboardEntry {
    pub rank: i64,
    pub user_id: Uuid,
    pub username: Option<String>,
    pub avatar_url: Option<String>,
    pub value: i32,
    pub badges: Vec<BadgeInfo>,
}

#[derive(Debug, Serialize)]
pub struct BadgeInfo {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub category: String,
    pub earned_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardResponse {
    pub entries: Vec<LeaderboardEntry>,
    pub period: String,
    pub metric: String,
    pub my_rank: Option<i64>,
    pub total_users: i64,
}

#[derive(Debug, Serialize)]
pub struct UserStatsResponse {
    pub total_scans: i32,
    pub total_published: i32,
    pub total_likes_received: i32,
    pub total_followers: i32,
    pub weekly_scans: i32,
    pub badges: Vec<BadgeInfo>,
    pub rank: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct AchievementResponse {
    pub id: Uuid,
    pub badge: Badge,
    pub earned_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct BadgeListResponse {
    pub badges: Vec<Badge>,
    pub earned: Vec<String>,
}
