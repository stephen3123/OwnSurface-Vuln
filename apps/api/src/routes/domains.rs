use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct VerifyDomainRequest {
    pub domain: String,
    #[serde(default = "default_method")]
    pub method: String,
}

fn default_method() -> String {
    "dns_txt".to_string()
}

/// POST /domains/verify — Start domain verification (Free: 1, Pro: unlimited)
pub async fn start_verification(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<VerifyDomainRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max_domains = plan.max_verified_domains();
    if max_domains == 0 {
        return Err(AppError::Forbidden(
            "Domain verification requires Pro plan. Upgrade at /pricing".into(),
        ));
    }
    if max_domains >= 0 {
        let current = db::count_user_verified_domains(&state.db, auth_user.id).await?;
        if current >= max_domains as i64 {
            return Err(AppError::Forbidden(format!(
                "Your plan allows {} verified domain(s). Upgrade to Pro for unlimited.",
                max_domains
            )));
        }
    }

    let domain = normalize_domain(&req.domain)?;
    let method = match req.method.as_str() {
        "dns_txt" | "html_meta" => req.method.clone(),
        _ => {
            return Err(AppError::BadRequest(
                "Method must be 'dns_txt' or 'html_meta'".into(),
            ))
        }
    };

    // Generate a unique verification token
    let token = format!(
        "xrai-verify-{}",
        Uuid::new_v4().to_string().replace('-', "")
    );

    let verification =
        db::create_domain_verification(&state.db, auth_user.id, &domain, &method, &token).await?;

    let instructions = match method.as_str() {
        "dns_txt" => format!(
            "Add a TXT record to your DNS for '{}' with value: {}",
            domain, token
        ),
        "html_meta" => format!(
            "Add this meta tag to your homepage <head>: <meta name=\"xrai-verification\" content=\"{}\">",
            token
        ),
        _ => unreachable!(),
    };

    Ok(Json(serde_json::json!({
        "verification": verification,
        "instructions": instructions,
        "token": token
    })))
}

/// POST /domains/verify/{id}/check — Check if verification is complete
pub async fn check_verification(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let verification = db::get_domain_verification(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Verification not found".into()))?;

    if verification.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your verification".into()));
    }

    if verification.verified {
        return Ok(Json(serde_json::json!({
            "verified": true,
            "domain": verification.domain,
            "verified_at": verification.verified_at
        })));
    }

    let is_verified = match verification.verification_method.as_str() {
        "dns_txt" => verify_dns_txt(&verification.domain, &verification.verification_token).await,
        "html_meta" => {
            verify_html_meta(&verification.domain, &verification.verification_token).await
        }
        _ => false,
    };

    if is_verified {
        db::mark_domain_verified(&state.db, id).await?;

        Ok(Json(serde_json::json!({
            "verified": true,
            "domain": verification.domain,
            "verified_at": chrono::Utc::now()
        })))
    } else {
        Ok(Json(serde_json::json!({
            "verified": false,
            "domain": verification.domain,
            "message": "Verification record not found. Please ensure you have added the verification record and allow time for DNS propagation."
        })))
    }
}

/// GET /domains — List user's verified domains
pub async fn list_domains(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let domains = db::get_user_domains(&state.db, auth_user.id).await?;

    Ok(Json(serde_json::json!({
        "domains": domains
    })))
}

/// DELETE /domains/{id} — Remove domain verification
pub async fn delete_domain(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    let verification = db::get_domain_verification(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Verification not found".into()))?;

    if verification.user_id != auth_user.id {
        return Err(AppError::Forbidden("Not your domain".into()));
    }

    db::delete_domain_verification(&state.db, id, auth_user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── Helpers ───

fn normalize_domain(domain: &str) -> AppResult<String> {
    let domain = domain
        .trim()
        .to_lowercase()
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .trim_end_matches('/')
        .split('/')
        .next()
        .unwrap_or("")
        .to_string();

    if domain.is_empty() || !domain.contains('.') {
        return Err(AppError::BadRequest("Invalid domain".into()));
    }

    // Block private/internal domains
    let blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if blocked.contains(&domain.as_str()) {
        return Err(AppError::BadRequest(
            "Internal domains are not allowed".into(),
        ));
    }

    Ok(domain)
}

async fn verify_dns_txt(domain: &str, token: &str) -> bool {
    // Use Google DNS-over-HTTPS to resolve TXT records (no dig dependency needed)
    let url = format!(
        "https://dns.google/resolve?name={}&type=TXT",
        domain
    );
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!(domain = %domain, error = %e, "Failed to build HTTP client for DNS");
            return false;
        }
    };

    match client.get(&url).send().await {
        Ok(resp) => {
            if let Ok(body) = resp.text().await {
                tracing::info!(domain = %domain, response = %body, "DNS TXT lookup response");
                body.contains(token)
            } else {
                false
            }
        }
        Err(e) => {
            tracing::warn!(domain = %domain, error = %e, "DNS-over-HTTPS lookup failed");
            false
        }
    }
}

async fn verify_html_meta(domain: &str, token: &str) -> bool {
    let url = format!("https://{}", domain);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(_) => return false,
    };

    match client.get(&url).send().await {
        Ok(resp) => {
            if let Ok(body) = resp.text().await {
                // Look for <meta name="xrai-verification" content="TOKEN">
                let search = format!("content=\"{}\"", token);
                body.contains(&search) && body.contains("xrai-verification")
            } else {
                false
            }
        }
        Err(e) => {
            tracing::warn!(domain = %domain, error = %e, "HTML meta verification fetch failed");
            false
        }
    }
}
