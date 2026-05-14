use axum::{
    extract::{Request, State},
    http::header::{AUTHORIZATION, COOKIE},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::user::{Claims, Plan};
use crate::services::db;
use crate::state::AppState;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub plan: String,
    /// Set when the request was authenticated via an API key (not JWT/session).
    pub api_key_id: Option<Uuid>,
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let (bearer_header, api_key) = extract_auth_headers(&request)?;
    let session_cookie = extract_session_cookie(&request, &state.config.session_cookie_name);
    let auth_user =
        extract_auth_user_from_headers(&state, bearer_header, api_key, session_cookie).await?;
    // Gate MCP access to Pro plan only
    let is_mcp_request = request
        .headers()
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|ua| ua.contains("ownsurface-mcp-server"))
        .unwrap_or(false);

    if is_mcp_request {
        let plan = Plan::from(auth_user.plan.clone());
        if !plan.has_mcp() {
            return Err(AppError::Forbidden(
                "MCP server access requires Pro plan. Upgrade at https://ownsurface.com/pricing".into(),
            ));
        }
    }

    request.extensions_mut().insert(auth_user);
    Ok(next.run(request).await)
}

pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    if let Ok((bearer_header, api_key)) = extract_auth_headers(&request) {
        let session_cookie = extract_session_cookie(&request, &state.config.session_cookie_name);
        if let Ok(auth_user) =
            extract_auth_user_from_headers(&state, bearer_header, api_key, session_cookie).await
        {
            request.extensions_mut().insert(auth_user);
        }
    }
    next.run(request).await
}

fn extract_auth_headers(request: &Request) -> Result<(Option<String>, Option<String>), AppError> {
    let bearer_header = request
        .headers()
        .get(AUTHORIZATION)
        .map(|value| {
            value
                .to_str()
                .map_err(|_| AppError::Unauthorized("Invalid authorization header".into()))
                .map(str::to_owned)
        })
        .transpose()?;

    let api_key = request
        .headers()
        .get("X-Api-Key")
        .map(|value| {
            value
                .to_str()
                .map_err(|_| AppError::Unauthorized("Invalid API key header".into()))
                .map(str::to_owned)
        })
        .transpose()?;

    Ok((bearer_header, api_key))
}

fn extract_session_cookie(request: &Request, cookie_name: &str) -> Option<String> {
    request
        .headers()
        .get(COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|cookies| {
            cookies
                .split(';')
                .map(str::trim)
                .find_map(|cookie| cookie.strip_prefix(&format!("{cookie_name}=")).map(str::to_owned))
        })
}

async fn extract_auth_user_from_headers(
    state: &AppState,
    bearer_header: Option<String>,
    api_key: Option<String>,
    session_cookie: Option<String>,
) -> Result<AuthUser, AppError> {
    let bearer_token = bearer_header
        .as_deref()
        .and_then(|auth_header| auth_header.strip_prefix("Bearer "))
        .map(str::to_owned);

    if let Some(token) = bearer_token.or(session_cookie) {
        let token_data = decode::<Claims>(
            &token,
            &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|e| AppError::Unauthorized(format!("Invalid token: {}", e)))?;

        let user = db::get_user_by_id(&state.db, token_data.claims.sub)
            .await?
            .ok_or_else(|| AppError::Unauthorized("User not found".into()))?;

        return Ok(AuthUser {
            id: user.id,
            email: user.email,
            plan: user.plan,
            api_key_id: None,
        });
    }

    // Try API key from X-Api-Key header
    if let Some(api_key) = api_key {
        if api_key.starts_with("xrai_") && api_key.len() > 20 {
            let key_hash = db::hash_api_key(&api_key);
            let api_key_record = db::validate_api_key(&state.db, &key_hash)
                .await?
                .ok_or_else(|| AppError::Unauthorized("Invalid API key".into()))?;

            let user = db::get_user_by_id(&state.db, api_key_record.user_id)
                .await?
                .ok_or_else(|| AppError::Unauthorized("User not found".into()))?;

            // Enforce per-key daily API call limit based on plan
            let plan = Plan::from(user.plan.clone());
            let max_calls = plan.max_api_calls_per_day();
            // requests_today was already incremented by validate_api_key
            if max_calls >= 0 && api_key_record.requests_today > max_calls {
                return Err(AppError::TooManyRequests(format!(
                    "API key daily limit exceeded ({}/{}). Upgrade your plan for more.",
                    api_key_record.requests_today, max_calls
                )));
            }

            return Ok(AuthUser {
                id: user.id,
                email: user.email,
                plan: user.plan,
                api_key_id: Some(api_key_record.id),
            });
        }
    }

    Err(AppError::Unauthorized("Missing authentication".into()))
}

pub fn generate_jwt(
    state: &AppState,
    user_id: Uuid,
    email: &str,
    plan: &str,
) -> Result<String, AppError> {
    let now = chrono::Utc::now().timestamp() as usize;
    let claims = Claims {
        sub: user_id,
        email: email.to_string(),
        plan: plan.to_string(),
        exp: now + 86400 * 7, // 7 days
        iat: now,
    };

    jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Failed to generate token: {}", e)))
}
