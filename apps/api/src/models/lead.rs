use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ─── Lead Search ───

#[derive(Debug, Deserialize)]
pub struct LeadSearchParams {
    pub q: Option<String>,
    pub technology: Option<String>,
    pub industry: Option<String>,
    pub employees: Option<String>,
    pub traffic_tier: Option<String>,
    pub location: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct LeadSearchResponse {
    pub results: Vec<LeadResult>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub has_more: bool,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct LeadResult {
    pub domain: String,
    pub url: Option<String>,
    pub company_name: Option<String>,
    pub industry: Option<String>,
    pub employees_range: Option<String>,
    pub location: Option<String>,
    pub traffic_tier: Option<String>,
    pub tranco_rank: Option<i32>,
    pub security_grade: Option<String>,
    pub security_score: Option<i32>,
    pub seo_score: Option<i32>,
    pub last_scanned: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DomainProfile {
    pub id: Uuid,
    pub domain: String,
    pub url: Option<String>,
    pub company_name: Option<String>,
    pub description: Option<String>,
    pub industry: Option<String>,
    pub location: Option<String>,
    pub employees_range: Option<String>,
    pub founded: Option<String>,
    pub logo_url: Option<String>,
    pub tranco_rank: Option<i32>,
    pub traffic_tier: Option<String>,
    pub estimated_monthly_visits: Option<String>,
    pub email_pattern: Option<String>,
    pub found_emails: Vec<String>,
    pub contact_page_url: Option<String>,
    pub team_page_url: Option<String>,
    pub social_links: serde_json::Value,
    pub security_grade: Option<String>,
    pub security_score: Option<i32>,
    pub seo_score: Option<i32>,
    pub has_pricing: Option<bool>,
    pub has_careers: Option<bool>,
    pub is_hiring: Option<bool>,
    pub payment_processors: Vec<String>,
    pub chat_widgets: Vec<String>,
    pub ad_pixels: Vec<String>,
    pub first_scanned: Option<DateTime<Utc>>,
    pub last_scanned: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct DomainProfilePublic {
    pub domain: String,
    pub url: Option<String>,
    pub company_name: Option<String>,
    pub description: Option<String>,
    pub industry: Option<String>,
    pub location: Option<String>,
    pub employees_range: Option<String>,
    pub founded: Option<String>,
    pub logo_url: Option<String>,
    pub tranco_rank: Option<i32>,
    pub traffic_tier: Option<String>,
    pub estimated_monthly_visits: Option<String>,
    pub email_pattern: Option<String>,
    pub found_emails: Vec<String>,
    pub contact_page_url: Option<String>,
    pub team_page_url: Option<String>,
    pub social_links: serde_json::Value,
    pub security_grade: Option<String>,
    pub security_score: Option<i32>,
    pub seo_score: Option<i32>,
    pub has_pricing: Option<bool>,
    pub has_careers: Option<bool>,
    pub is_hiring: Option<bool>,
    pub payment_processors: Vec<String>,
    pub chat_widgets: Vec<String>,
    pub ad_pixels: Vec<String>,
    pub technologies: Vec<TechnologyEntry>,
    pub last_scanned: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TechnologyEntry {
    pub technology_name: String,
    pub category: Option<String>,
    pub version: Option<String>,
    pub confidence: Option<f32>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TechnologyCount {
    pub technology_name: String,
    pub category: Option<String>,
    pub domain_count: Option<i64>,
}

// ─── Traffic History ───

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TrafficHistoryEntry {
    pub domain: String,
    pub tranco_rank: Option<i32>,
    pub traffic_tier: Option<String>,
    pub estimated_monthly_visits: Option<String>,
    pub composite_score: Option<i32>,
    pub crux_lcp_ms: Option<i32>,
    pub crux_fid_ms: Option<i32>,
    pub crux_cls: Option<f32>,
    pub data_sources: Vec<String>,
    pub recorded_at: Option<DateTime<Utc>>,
}

// ─── AI Visibility ───

#[derive(Debug, Deserialize)]
pub struct AiVisibilityRequest {
    pub domain: String,
    pub brand_name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AiVisibilityCheck {
    pub id: Uuid,
    pub domain: String,
    pub user_id: Uuid,
    pub brand_name: String,
    pub industry: Option<String>,
    pub overall_score: Option<i32>,
    pub models_checked: Option<i32>,
    pub models_mentioning: Option<i32>,
    pub status: String,
    pub created_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AiVisibilityResult {
    pub id: Uuid,
    pub check_id: Uuid,
    pub query: String,
    pub model: String,
    pub brand_mentioned: Option<bool>,
    pub mention_context: Option<String>,
    pub mention_position: Option<i32>,
    pub competitor_mentions: Vec<String>,
    pub response_snippet: Option<String>,
    pub checked_at: Option<DateTime<Utc>>,
}
