use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::IntoResponse,
    Extension, Json,
};
use serde_json::json;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::lead::{DomainProfilePublic, LeadSearchParams, LeadSearchResponse};
use crate::models::user::Plan;
use crate::services::db;
use crate::state::AppState;

/// GET /api/v1/leads/search — Search leads by technology, industry, employees, etc.
pub async fn search_leads(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Query(params): Query<LeadSearchParams>,
) -> AppResult<Json<LeadSearchResponse>> {
    let plan = Plan::from(auth_user.plan.clone());
    let max_results = plan.lead_search_results();

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).min(100);

    let (results, total) = db::search_leads(&state.db, &params, page, per_page).await?;

    // Free plan: limit to 3 results
    let results = if max_results >= 0 {
        results.into_iter().take(max_results as usize).collect()
    } else {
        results
    };

    let has_more = if max_results >= 0 {
        total > max_results as i64
    } else {
        (page * per_page) < total
    };

    Ok(Json(LeadSearchResponse {
        results,
        total,
        page,
        per_page,
        has_more,
    }))
}

/// GET /api/v1/leads/technologies — List indexed technologies with domain counts
pub async fn list_technologies(
    Extension(_auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let technologies = db::list_indexed_technologies(&state.db).await?;
    Ok(Json(json!({ "technologies": technologies })))
}

/// GET /api/v1/leads/export — CSV export of search results (Pro only)
pub async fn export_leads(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Query(params): Query<LeadSearchParams>,
) -> AppResult<impl IntoResponse> {
    let plan = Plan::from(auth_user.plan.clone());
    if !plan.has_lead_export() {
        return Err(AppError::Forbidden(
            "CSV export requires Pro plan. Upgrade at /pricing".into(),
        ));
    }

    let (results, _total) = db::search_leads(&state.db, &params, 1, 5000).await?;

    // Helper to properly escape CSV fields (quotes, commas, newlines)
    fn csv_escape(s: &str) -> String {
        if s.contains(',') || s.contains('"') || s.contains('\n') {
            format!("\"{}\"", s.replace('"', "\"\""))
        } else {
            s.to_string()
        }
    }

    let mut csv = String::from("domain,company_name,industry,employees,location,traffic_tier,tranco_rank,security_grade,last_scanned\n");
    for r in &results {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{}\n",
            csv_escape(&r.domain),
            csv_escape(r.company_name.as_deref().unwrap_or("")),
            csv_escape(r.industry.as_deref().unwrap_or("")),
            csv_escape(r.employees_range.as_deref().unwrap_or("")),
            csv_escape(r.location.as_deref().unwrap_or("")),
            csv_escape(r.traffic_tier.as_deref().unwrap_or("")),
            r.tranco_rank.map(|r| r.to_string()).unwrap_or_default(),
            csv_escape(r.security_grade.as_deref().unwrap_or("")),
            r.last_scanned.map(|d| d.to_rfc3339()).unwrap_or_default(),
        ));
    }

    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "text/csv"),
            (
                header::CONTENT_DISPOSITION,
                "attachment; filename=\"leads.csv\"",
            ),
        ],
        csv,
    ))
}

/// GET /api/v1/leads/domain/{domain} — Full domain profile + contact card
pub async fn get_domain_profile(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<Json<DomainProfilePublic>> {
    let domain = domain.trim().to_lowercase();
    let plan = Plan::from(auth_user.plan.clone());

    let profile = db::get_domain_profile(&state.db, &domain)
        .await?
        .ok_or_else(|| AppError::NotFound("Domain profile not found".into()))?;

    let technologies = db::get_domain_technologies(&state.db, &domain).await?;

    // Mask emails for free users
    let found_emails = if plan.has_contact_reveal() {
        profile.found_emails
    } else {
        profile
            .found_emails
            .iter()
            .map(|e| {
                let parts: Vec<&str> = e.split('@').collect();
                if parts.len() == 2 {
                    let local = parts[0];
                    // Only reveal first char to prevent phishing inference
                    let masked = if local.len() > 1 {
                        format!("{}****@{}", &local[..1], parts[1])
                    } else {
                        format!("****@{}", parts[1])
                    };
                    masked
                } else {
                    "****".to_string()
                }
            })
            .collect()
    };

    Ok(Json(DomainProfilePublic {
        domain: profile.domain,
        url: profile.url,
        company_name: profile.company_name,
        description: profile.description,
        industry: profile.industry,
        location: profile.location,
        employees_range: profile.employees_range,
        founded: profile.founded,
        logo_url: profile.logo_url,
        tranco_rank: profile.tranco_rank,
        traffic_tier: profile.traffic_tier,
        estimated_monthly_visits: profile.estimated_monthly_visits,
        email_pattern: if plan.has_contact_reveal() {
            profile.email_pattern
        } else {
            profile.email_pattern.map(|_| "Upgrade to Pro to reveal".to_string())
        },
        found_emails,
        contact_page_url: profile.contact_page_url,
        team_page_url: profile.team_page_url,
        social_links: profile.social_links,
        security_grade: profile.security_grade,
        security_score: profile.security_score,
        seo_score: profile.seo_score,
        has_pricing: profile.has_pricing,
        has_careers: profile.has_careers,
        is_hiring: profile.is_hiring,
        payment_processors: profile.payment_processors,
        chat_widgets: profile.chat_widgets,
        ad_pixels: profile.ad_pixels,
        technologies,
        last_scanned: profile.last_scanned,
    }))
}

/// GET /api/v1/traffic/{domain} — Traffic data + history
pub async fn get_traffic(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(domain): axum::extract::Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let domain = domain.trim().to_lowercase();
    let plan = Plan::from(auth_user.plan.clone());

    let profile = db::get_domain_profile(&state.db, &domain).await?;

    let current = profile.map(|p| {
        json!({
            "tranco_rank": p.tranco_rank,
            "traffic_tier": p.traffic_tier,
            "estimated_monthly_visits": p.estimated_monthly_visits,
        })
    });

    if !plan.is_pro() {
        return Ok(Json(json!({
            "domain": domain,
            "current": current,
            "history": [],
            "upgrade_message": "Upgrade to Pro for full traffic history and CrUX data"
        })));
    }

    let history = db::get_traffic_history(&state.db, &domain, 365).await?;

    Ok(Json(json!({
        "domain": domain,
        "current": current,
        "history": history,
    })))
}
