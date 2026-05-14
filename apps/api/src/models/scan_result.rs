use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Technology {
    pub name: String,
    pub category: String,
    pub version: Option<String>,
    pub confidence: f64,
    pub website: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSLInfo {
    pub valid: bool,
    pub issuer: String,
    pub expires_at: String,
    pub protocol: String,
    pub days_until_expiry: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeaderCheck {
    pub name: String,
    pub present: bool,
    pub value: Option<String>,
    pub recommendation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScore {
    pub score: u32,
    pub grade: String,
    pub ssl: SSLInfo,
    pub headers: Vec<HeaderCheck>,
    pub issues: Vec<String>,
    pub https_redirect: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyInfo {
    pub name: Option<String>,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub industry: Option<String>,
    pub founded: Option<String>,
    pub location: Option<String>,
    pub employees_range: Option<String>,
    #[serde(rename = "type")]
    pub company_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialLink {
    pub platform: String,
    pub url: String,
    pub handle: Option<String>,
    pub followers: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoData {
    pub domain_age_days: Option<i64>,
    pub meta_title: Option<String>,
    pub meta_title_length: Option<usize>,
    pub meta_description: Option<String>,
    pub meta_description_length: Option<usize>,
    pub has_sitemap: bool,
    pub has_robots: bool,
    pub heading_structure: HeadingStructure,
    pub has_structured_data: bool,
    pub canonical_url: Option<String>,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadingStructure {
    pub h1: u32,
    pub h2: u32,
    pub h3: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessSignals {
    pub has_pricing: bool,
    pub has_careers: bool,
    pub ad_pixels: Vec<String>,
    pub chat_widgets: Vec<String>,
    pub payment_processors: Vec<String>,
    pub is_hiring: bool,
    pub is_monetized: bool,
    pub email_providers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficData {
    pub tranco_rank: Option<u64>,
    pub traffic_tier: String,
    pub estimated_monthly_visits: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Competitor {
    pub url: String,
    pub name: Option<String>,
    pub similarity_score: f64,
    pub shared_technologies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostItem {
    pub category: String,
    pub service: String,
    pub min_monthly: f64,
    pub max_monthly: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEstimate {
    pub total_monthly_min: f64,
    pub total_monthly_max: f64,
    pub breakdown: Vec<CostItem>,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub id: Option<Uuid>,
    pub url: String,
    pub url_hash: String,
    pub tech_stack: Vec<Technology>,
    pub security: SecurityScore,
    pub company: CompanyInfo,
    pub social_links: Vec<SocialLink>,
    pub seo: SeoData,
    pub business_signals: BusinessSignals,
    pub traffic: TrafficData,
    pub competitors: Vec<Competitor>,
    pub cost_estimate: CostEstimate,
    pub ai_summary: String,
    pub scanned_at: DateTime<Utc>,
    pub scan_duration_ms: Option<u64>,
    // Phase 1: Vulnerability scanner results
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vulnerability: Option<serde_json::Value>,
    // Phase 2: Intelligence results
    #[serde(skip_serializing_if = "Option::is_none")]
    pub privacy: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wayback: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub js_bundles: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_endpoints: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supply_chain: Option<serde_json::Value>,
    // Phase 6: Performance/Accessibility
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accessibility: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lighthouse: Option<serde_json::Value>,
    // Phase 7: Sustainability
    #[serde(skip_serializing_if = "Option::is_none")]
    pub carbon: Option<serde_json::Value>,
    // Security findings with actionable fixes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub security_findings: Option<serde_json::Value>,
    // Email pattern detection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email_patterns: Option<serde_json::Value>,
    // Passive security scanners
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secrets_passive: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub waf_info: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graphql_info: Option<serde_json::Value>,
    // Phase 9: Vibe-code & BaaS scanners
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firebase_audit: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supabase_audit: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env_leaks: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub llm_keys: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_auth: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vibe_code: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nextauth_audit: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub webhook_audit: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub csp_bypass: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cache_poisoning: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prototype_pollution: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cors_deep: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dependency_audit: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_upload: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub s3_buckets_deep: Option<serde_json::Value>,
    // Viewport screenshot (base64 PNG)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub screenshot: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanRequest {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResponse {
    pub scan_id: Uuid,
    pub status: String,
    pub result: Option<ScanResult>,
    pub cached: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ScanRow {
    pub id: Uuid,
    pub url: String,
    pub url_hash: String,
    pub result: serde_json::Value,
    pub scanned_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}
