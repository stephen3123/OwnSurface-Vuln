use axum::{extract::State, Json};
use serde::Serialize;
use serde_json::Value;

use crate::state::AppState;

#[derive(Serialize, sqlx::FromRow)]
pub struct ShowcaseScan {
    pub domain: String,
    pub url: String,
    pub category: String,
    pub tech_stack: Value,
    pub security_grade: Option<String>,
    pub security_score: Option<i32>,
    pub seo_score: Option<i32>,
    pub traffic_rank: Option<i32>,
    pub estimated_visits: Option<String>,
    pub company_name: Option<String>,
    pub company_industry: Option<String>,
    pub ai_summary: Option<String>,
    pub scanned_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ShowcaseDomain {
    pub domain: String,
}

/// Public endpoint — no auth required.
/// Returns up to 60 random showcase scans for the landing page.
pub async fn get_showcase(State(state): State<AppState>) -> Json<Vec<ShowcaseScan>> {
    let scans = sqlx::query_as::<_, ShowcaseScan>(
        "SELECT domain, url, category, tech_stack, security_grade, security_score,
                seo_score, traffic_rank, estimated_visits, company_name, company_industry,
                ai_summary, scanned_at
         FROM showcase_scans
         ORDER BY RANDOM()
         LIMIT 60",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Json(scans)
}

/// Public endpoint — returns ALL showcase domain names for sitemap generation.
/// Lightweight: only returns domain strings, no scan data.
pub async fn get_showcase_domains(State(state): State<AppState>) -> Json<Vec<ShowcaseDomain>> {
    let domains = sqlx::query_as::<_, ShowcaseDomain>(
        "SELECT domain FROM showcase_scans ORDER BY domain",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Json(domains)
}
