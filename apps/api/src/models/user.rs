use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Plan {
    Free,
    Pro,
}

impl Plan {
    pub fn is_pro(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn scans_per_day(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_watchlists(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_watchlist_urls(&self) -> i32 {
        match self {
            Plan::Free => 5,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_bulk_urls(&self) -> i32 {
        match self {
            Plan::Free => 10,
            Plan::Pro => 1000,
        }
    }

    /// Monthly bulk scan jobs allowed (-1 = unlimited)
    pub fn bulk_scans_per_month(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn has_api_access(&self) -> bool {
        true
    }

    pub fn max_api_keys(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => 10,
        }
    }

    pub fn max_api_calls_per_day(&self) -> i32 {
        match self {
            Plan::Free => 10,
            Plan::Pro => 10_000,
        }
    }

    pub fn max_verified_domains(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_collections(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_reports(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn has_pdf_export(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    /// Monthly deep scans allowed (-1 = unlimited, 0 = blocked)
    pub fn deep_scans_per_month(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Monthly attack surface audits allowed (-1 = unlimited, 0 = blocked)
    pub fn attack_surface_per_month(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Monthly offensive scans allowed (-1 = unlimited, 0 = blocked)
    pub fn offensive_scans_per_month(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Daily App Store checks allowed (-1 = unlimited)
    pub fn appstore_checks_per_day(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Daily extension scans allowed (-1 = unlimited)
    pub fn extension_scans_per_day(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Monthly mobile security audits allowed (-1 = unlimited, 0 = blocked)
    pub fn mobile_audits_per_month(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_uptime_monitors(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn max_ssl_monitors(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => -1, // unlimited
        }
    }

    /// Speed monitoring is Pro-only (no free tier)
    pub fn has_speed_monitoring(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    /// Teams feature is disabled for now (coming soon)
    pub fn has_teams(&self) -> bool {
        false
    }

    pub fn max_team_seats(&self) -> i32 {
        match self {
            Plan::Free => 1,
            Plan::Pro => 5,
        }
    }

    pub fn has_scheduled_reports(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn has_enrichment(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn has_mcp(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn has_webhooks(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    /// Feed/social feature is disabled for now (coming soon)
    pub fn has_feed_publish(&self) -> bool {
        false
    }

    /// Lead search: Free gets 3 results, Pro gets unlimited
    pub fn lead_search_results(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => -1, // unlimited
        }
    }

    pub fn has_lead_export(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn has_contact_reveal(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn has_ai_visibility(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn ai_visibility_checks_per_month(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => 10,
        }
    }

    pub fn has_brand_mentions(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn mention_scans_per_day(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => 5,
        }
    }

    pub fn has_thread_discovery(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn thread_discoveries_per_day(&self) -> i32 {
        match self {
            Plan::Free => 0,
            Plan::Pro => 3,
        }
    }

    pub fn has_reply_drafting(&self) -> bool {
        matches!(self, Plan::Pro)
    }

    pub fn history_days(&self) -> i32 {
        match self {
            Plan::Free => 3,
            Plan::Pro => 365,
        }
    }
}

impl std::fmt::Display for Plan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Plan::Free => write!(f, "free"),
            Plan::Pro => write!(f, "pro"),
        }
    }
}

impl From<String> for Plan {
    fn from(s: String) -> Self {
        match s.as_str() {
            // Map legacy plan names to Pro
            "pro" | "business" | "enterprise" => Plan::Pro,
            _ => Plan::Free,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: Option<String>,
    pub username: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_public: Option<bool>,
    pub plan: String,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub team_id: Option<Uuid>,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub scans_today: i32,
    pub scans_reset_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub fn plan_enum(&self) -> Plan {
        Plan::from(self.plan.clone())
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VerifyRegistrationRequest {
    pub email: String,
    pub otp: String,
}

#[derive(Debug, Deserialize)]
pub struct ResendRegistrationRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RequestPasswordResetRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct ConfirmPasswordResetRequest {
    pub email: String,
    pub otp: String,
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserPublic,
}

#[derive(Debug, Serialize)]
pub struct OtpDispatchResponse {
    pub status: &'static str,
    pub expires_in_seconds: i64,
    pub retry_after_seconds: i64,
}

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub status: &'static str,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub plan: String,
    pub team_id: Option<Uuid>,
    pub scans_today: i32,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            name: u.name,
            plan: u.plan,
            team_id: u.team_id,
            scans_today: u.scans_today,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub plan: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuthOtp {
    pub id: Uuid,
    pub email: String,
    pub purpose: String,
    pub code_hash: String,
    pub attempt_count: i32,
    pub max_attempts: i32,
    pub expires_at: DateTime<Utc>,
    pub consumed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub last_sent_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub key_hash: String,
    pub key_prefix: String,
    pub name: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub requests_today: i32,
    pub requests_reset_at: DateTime<Utc>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsProfileRequest {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotificationPrefsRequest {
    pub scan_complete: Option<bool>,
    pub watchlist_changes: Option<bool>,
    pub security_alerts: Option<bool>,
    pub weekly_digest: Option<bool>,
    pub marketing: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteAccountRequest {
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct CreateApiKeyResponse {
    pub api_key: ApiKeyPublic,
    pub key: String,
}

#[derive(Debug, Serialize)]
pub struct ApiKeyPublic {
    pub id: Uuid,
    pub name: String,
    pub key_prefix: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub requests_today: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

impl From<ApiKey> for ApiKeyPublic {
    fn from(k: ApiKey) -> Self {
        Self {
            id: k.id,
            name: k.name,
            key_prefix: k.key_prefix,
            last_used_at: k.last_used_at,
            requests_today: k.requests_today,
            is_active: k.is_active,
            created_at: k.created_at,
        }
    }
}
