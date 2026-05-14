use argon2::{password_hash::SaltString, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Extension, Json,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use rand::{rngs::OsRng, Rng};
use redis::AsyncCommands;
use sha2::Sha256;
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::{generate_jwt, AuthUser};
use crate::models::user::*;
use crate::services::db;
use crate::state::AppState;

type HmacSha256 = Hmac<Sha256>;

const OTP_PURPOSE_REGISTER: &str = "register";
const OTP_PURPOSE_RESET_PASSWORD: &str = "reset_password";
const OTP_MAX_ATTEMPTS: i32 = 5;
const OTP_SEND_WINDOW_SECONDS: usize = 15 * 60;
const OTP_SEND_WINDOW_MAX: i64 = 3;
const OTP_VERIFY_WINDOW_SECONDS: usize = 60 * 60;
const OTP_VERIFY_WINDOW_MAX: i64 = 10;
const OTP_IP_DAILY_MAX: i64 = 20;

pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<OtpDispatchResponse>)> {
    let email = normalize_email(&req.email)?;
    let name = normalize_optional(&req.name);
    validate_password(&req.password)?;

    let password_hash = hash_password(&req.password)?;

    let user = match db::get_user_by_email(&state.db, &email).await? {
        Some(user) if user.email_verified_at.is_some() => {
            return Err(AppError::Conflict("Email already registered".into()));
        }
        Some(user) => {
            db::update_user_registration_details(
                &state.db,
                user.id,
                &password_hash,
                name.as_deref(),
            )
            .await?
        }
        None => db::create_user(&state.db, &email, &password_hash, name.as_deref(), None).await?,
    };

    let client_ip = extract_client_ip(&headers);
    let response = dispatch_otp(&state, &user.email, OTP_PURPOSE_REGISTER, &client_ip).await?;

    tracing::info!(email = %user.email, purpose = OTP_PURPOSE_REGISTER, "otp_requested");

    Ok((StatusCode::ACCEPTED, Json(response)))
}

pub async fn verify_registration(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(req): Json<VerifyRegistrationRequest>,
) -> AppResult<(CookieJar, Json<AuthResponse>)> {
    let email = normalize_email(&req.email)?;
    let otp = normalize_otp(&req.otp)?;

    enforce_verify_rate_limit(&state, &email, OTP_PURPOSE_REGISTER).await?;

    let user = db::get_user_by_email(&state.db, &email)
        .await?
        .ok_or_else(|| AppError::BadRequest("Invalid or expired code".into()))?;

    if user.email_verified_at.is_some() {
        return Err(AppError::Conflict("Email is already verified".into()));
    }

    verify_otp(&state, &email, OTP_PURPOSE_REGISTER, &otp).await?;

    let user = db::mark_user_email_verified(&state.db, user.id).await?;
    let token = generate_jwt(&state, user.id, &user.email, &user.plan)?;

    clear_verify_failures(&state, &email, OTP_PURPOSE_REGISTER).await;
    tracing::info!(email = %email, purpose = OTP_PURPOSE_REGISTER, "otp_verified");

    // Send welcome email asynchronously (don't block registration)
    let mailer = state.mailer.clone();
    let welcome_email = email.clone();
    let welcome_name = user.name.clone();
    tokio::spawn(async move {
        if let Err(e) = mailer
            .send_welcome_email(&welcome_email, welcome_name.as_deref())
            .await
        {
            tracing::warn!(email = %welcome_email, error = %e, "welcome_email_dispatch_failed");
        }
    });

    Ok((
        with_session_cookie(jar, &state, &token),
        Json(AuthResponse {
            token,
            user: user.into(),
        }),
    ))
}

pub async fn resend_registration_otp(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ResendRegistrationRequest>,
) -> AppResult<(StatusCode, Json<OtpDispatchResponse>)> {
    let email = normalize_email(&req.email)?;
    let user = db::get_user_by_email(&state.db, &email)
        .await?
        .ok_or_else(|| {
            AppError::BadRequest("No pending registration found for this email".into())
        })?;

    if user.email_verified_at.is_some() {
        return Err(AppError::Conflict("Email is already verified".into()));
    }

    let client_ip = extract_client_ip(&headers);
    let response = dispatch_otp(&state, &email, OTP_PURPOSE_REGISTER, &client_ip).await?;

    tracing::info!(email = %email, purpose = OTP_PURPOSE_REGISTER, "otp_resent");

    Ok((StatusCode::ACCEPTED, Json(response)))
}

pub async fn request_password_reset(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RequestPasswordResetRequest>,
) -> AppResult<(StatusCode, Json<OtpDispatchResponse>)> {
    let email = normalize_email(&req.email)?;
    let client_ip = extract_client_ip(&headers);

    if let Some(user) = db::get_user_by_email(&state.db, &email).await? {
        if user.email_verified_at.is_some() {
            dispatch_otp(&state, &email, OTP_PURPOSE_RESET_PASSWORD, &client_ip).await?;
            tracing::info!(email = %email, purpose = OTP_PURPOSE_RESET_PASSWORD, "password_reset_requested");
        }
    }

    Ok((
        StatusCode::ACCEPTED,
        Json(otp_dispatch_response(&state, "reset_requested")),
    ))
}

pub async fn confirm_password_reset(
    State(state): State<AppState>,
    Json(req): Json<ConfirmPasswordResetRequest>,
) -> AppResult<Json<StatusResponse>> {
    let email = normalize_email(&req.email)?;
    let otp = normalize_otp(&req.otp)?;
    validate_password(&req.new_password)?;

    enforce_verify_rate_limit(&state, &email, OTP_PURPOSE_RESET_PASSWORD).await?;

    let user = db::get_user_by_email(&state.db, &email)
        .await?
        .filter(|user| user.email_verified_at.is_some())
        .ok_or_else(|| AppError::BadRequest("Invalid or expired code".into()))?;

    verify_otp(&state, &email, OTP_PURPOSE_RESET_PASSWORD, &otp).await?;

    let password_hash = hash_password(&req.new_password)?;
    db::update_user_password_hash(&state.db, user.id, &password_hash).await?;

    clear_verify_failures(&state, &email, OTP_PURPOSE_RESET_PASSWORD).await;
    tracing::info!(email = %email, purpose = OTP_PURPOSE_RESET_PASSWORD, "password_reset_completed");

    Ok(Json(StatusResponse {
        status: "password_reset",
    }))
}

pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(req): Json<LoginRequest>,
) -> AppResult<(CookieJar, Json<AuthResponse>)> {
    let email = normalize_email(&req.email)?;
    let user = db::get_user_by_email(&state.db, &email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    verify_password(&user.password_hash, &req.password)?;

    if user.email_verified_at.is_none() {
        return Err(AppError::EmailNotVerified(
            "Please verify your email before signing in.".into(),
        ));
    }

    let token = generate_jwt(&state, user.id, &user.email, &user.plan)?;

    Ok((
        with_session_cookie(jar, &state, &token),
        Json(AuthResponse {
            token,
            user: user.into(),
        }),
    ))
}

pub async fn session(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<UserPublic>> {
    me(Extension(auth_user), State(state)).await
}

pub async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> AppResult<(CookieJar, Json<StatusResponse>)> {
    Ok((
        clear_session_cookie(jar, &state),
        Json(StatusResponse { status: "logged_out" }),
    ))
}

pub async fn me(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<UserPublic>> {
    let mut user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let key = format!(
        "rate_limit:{}:{}",
        auth_user.id,
        chrono::Utc::now().format("%Y-%m-%d")
    );

    if let Ok(mut conn) = state.redis.get_multiplexed_async_connection().await {
        let count: i64 = conn.get(&key).await.unwrap_or(0);
        user.scans_today = count as i32;
    }

    Ok(Json(user.into()))
}

pub async fn change_password(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<ChangePasswordRequest>,
) -> AppResult<Json<StatusResponse>> {
    validate_password(&req.new_password)?;

    let user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    // Verify current password
    verify_password(&user.password_hash, &req.current_password)?;

    // Ensure new password is different
    if req.current_password == req.new_password {
        return Err(AppError::BadRequest(
            "New password must be different from current password".into(),
        ));
    }

    let new_hash = hash_password(&req.new_password)?;
    db::update_user_password_hash(&state.db, user.id, &new_hash).await?;

    tracing::info!(user_id = %user.id, "password_changed_from_settings");

    Ok(Json(StatusResponse {
        status: "password_changed",
    }))
}

pub async fn update_settings_profile(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<UpdateSettingsProfileRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let name = req.name.as_ref()
        .map(|n| sanitize_text(n.trim()))
        .filter(|n| !n.is_empty() && n.len() <= 100);

    db::update_user_name(&state.db, auth_user.id, name.as_deref()).await?;

    let user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(Json(serde_json::json!({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "updated_at": user.updated_at,
    })))
}

pub async fn update_notification_prefs(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<UpdateNotificationPrefsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let prefs = serde_json::json!({
        "scan_complete": req.scan_complete.unwrap_or(true),
        "watchlist_changes": req.watchlist_changes.unwrap_or(true),
        "security_alerts": req.security_alerts.unwrap_or(true),
        "weekly_digest": req.weekly_digest.unwrap_or(false),
        "marketing": req.marketing.unwrap_or(false),
    });

    db::upsert_notification_prefs(&state.db, auth_user.id, &prefs).await?;

    Ok(Json(serde_json::json!({
        "status": "saved",
        "preferences": prefs,
    })))
}

pub async fn get_notification_prefs(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<serde_json::Value>> {
    let prefs = db::get_notification_prefs(&state.db, auth_user.id).await?;

    let defaults = serde_json::json!({
        "scan_complete": true,
        "watchlist_changes": true,
        "security_alerts": true,
        "weekly_digest": false,
        "marketing": false,
    });

    Ok(Json(prefs.unwrap_or(defaults)))
}

pub async fn delete_account(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<DeleteAccountRequest>,
) -> AppResult<Json<StatusResponse>> {
    let user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    // Verify password before deletion
    verify_password(&user.password_hash, &req.password)?;

    // Cancel Stripe subscription if exists
    if let Some(ref sub_id) = user.stripe_subscription_id {
        if let Err(e) = crate::services::stripe::cancel_subscription(&state, sub_id).await {
            tracing::warn!(
                user_id = %user.id,
                error = %e,
                "failed_to_cancel_stripe_subscription_on_account_delete"
            );
        }
    }

    db::delete_user(&state.db, user.id).await?;

    tracing::info!(user_id = %user.id, email = %user.email, "account_deleted");

    Ok(Json(StatusResponse {
        status: "account_deleted",
    }))
}

pub async fn create_api_key(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CreateApiKeyRequest>,
) -> AppResult<(StatusCode, Json<CreateApiKeyResponse>)> {
    // Enforce API key limit per plan
    let plan = crate::models::user::Plan::from(auth_user.plan.clone());
    let max_keys = plan.max_api_keys();
    let existing_keys = db::get_user_api_keys(&state.db, auth_user.id).await?;
    if max_keys >= 0 && existing_keys.len() >= max_keys as usize {
        return Err(AppError::Forbidden(format!(
            "Your plan allows {} API key(s). Upgrade to Pro for more.",
            max_keys
        )));
    }

    let raw_key = format!("xrai_{}", generate_random_string(32));
    let key_hash = db::hash_api_key(&raw_key);
    let key_prefix = format!(
        "xrai_{}...{}",
        &raw_key[5..9],
        &raw_key[raw_key.len() - 4..]
    );

    let api_key =
        db::create_api_key(&state.db, auth_user.id, &req.name, &key_hash, &key_prefix).await?;

    Ok((
        StatusCode::CREATED,
        Json(CreateApiKeyResponse {
            api_key: api_key.into(),
            key: raw_key,
        }),
    ))
}

pub async fn list_api_keys(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> AppResult<Json<Vec<ApiKeyPublic>>> {
    let keys = db::get_user_api_keys(&state.db, auth_user.id).await?;
    Ok(Json(keys.into_iter().map(|k| k.into()).collect()))
}

pub async fn revoke_api_key(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> AppResult<StatusCode> {
    db::delete_api_key(&state.db, id, auth_user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn dispatch_otp(
    state: &AppState,
    email: &str,
    purpose: &str,
    client_ip: &str,
) -> AppResult<OtpDispatchResponse> {
    ensure_send_rate_limit(state, email, purpose, client_ip).await?;

    if let Some(latest) = db::get_latest_auth_otp(&state.db, email, purpose).await? {
        let seconds_since_last_send = (Utc::now() - latest.last_sent_at).num_seconds();
        if seconds_since_last_send < state.config.otp_resend_cooldown_seconds {
            return Err(AppError::TooManyRequests(format!(
                "Please wait {} seconds before requesting another code.",
                state.config.otp_resend_cooldown_seconds - seconds_since_last_send
            )));
        }
    }

    let code = generate_otp_code();
    let code_hash = compute_otp_hash(state, email, purpose, &code)?;
    let expires_at = Utc::now() + Duration::seconds(state.config.otp_ttl_seconds);

    db::invalidate_active_auth_otps(&state.db, email, purpose).await?;
    db::create_auth_otp(
        &state.db,
        email,
        purpose,
        &code_hash,
        expires_at,
        OTP_MAX_ATTEMPTS,
    )
    .await?;

    let expires_in_minutes = ((state.config.otp_ttl_seconds + 59) / 60).max(1);
    let email_result = match purpose {
        OTP_PURPOSE_REGISTER => {
            state
                .mailer
                .send_registration_otp(email, &code, expires_in_minutes)
                .await
        }
        OTP_PURPOSE_RESET_PASSWORD => {
            state
                .mailer
                .send_password_reset_otp(email, &code, expires_in_minutes)
                .await
        }
        _ => return Err(AppError::Internal("Unsupported OTP purpose".into())),
    };

    match email_result {
        Ok(()) => {
            tracing::info!(email = %email, purpose = %purpose, "otp_email_delivered");
        }
        Err(e) => {
            // Email delivery failed — never log the OTP code in production
            tracing::error!(
                email = %email,
                purpose = %purpose,
                error = %e,
                "otp_email_delivery_failed"
            );
            return Err(AppError::Internal(
                "Failed to send verification email. Please try again.".into(),
            ));
        }
    }

    Ok(otp_dispatch_response(state, "otp_sent"))
}

async fn verify_otp(state: &AppState, email: &str, purpose: &str, otp: &str) -> AppResult<()> {
    let record = db::get_latest_auth_otp(&state.db, email, purpose)
        .await?
        .ok_or_else(|| AppError::BadRequest("Invalid or expired code".into()))?;

    if record.consumed_at.is_some()
        || record.expires_at < Utc::now()
        || record.attempt_count >= record.max_attempts
    {
        record_verify_failure(state, email, purpose).await;
        return Err(AppError::BadRequest("Invalid or expired code".into()));
    }

    let candidate_hash = compute_otp_hash(state, email, purpose, otp)?;
    if candidate_hash != record.code_hash {
        let updated = db::increment_auth_otp_attempt(&state.db, record.id).await?;
        if updated.attempt_count >= updated.max_attempts {
            if let Err(e) = db::consume_auth_otp(&state.db, updated.id).await {
                tracing::warn!(otp_id = %updated.id, error = %e, "Failed to consume exhausted OTP");
            }
        }
        record_verify_failure(state, email, purpose).await;
        return Err(AppError::BadRequest("Invalid or expired code".into()));
    }

    db::consume_auth_otp(&state.db, record.id).await?;
    Ok(())
}

async fn ensure_send_rate_limit(
    state: &AppState,
    email: &str,
    purpose: &str,
    client_ip: &str,
) -> AppResult<()> {
    let email_key = format!("auth:otp:send:{purpose}:{email}");
    let ip_key = format!(
        "auth:otp:send-ip:{}:{}",
        client_ip,
        Utc::now().format("%Y-%m-%d")
    );

    let mut conn = state.redis.get_multiplexed_async_connection().await?;
    let email_count = increment_counter(&mut conn, &email_key, OTP_SEND_WINDOW_SECONDS).await?;
    if email_count > OTP_SEND_WINDOW_MAX {
        return Err(AppError::TooManyRequests(
            "Too many OTP requests for this email. Please try again later.".into(),
        ));
    }

    let ip_count = increment_counter(&mut conn, &ip_key, 24 * 60 * 60).await?;
    if ip_count > OTP_IP_DAILY_MAX {
        return Err(AppError::TooManyRequests(
            "Too many OTP requests from this IP address today.".into(),
        ));
    }

    Ok(())
}

async fn enforce_verify_rate_limit(state: &AppState, email: &str, purpose: &str) -> AppResult<()> {
    let key = format!("auth:otp:verify-fail:{purpose}:{email}");
    let mut conn = state.redis.get_multiplexed_async_connection().await?;
    let count: i64 = conn.get(&key).await.unwrap_or(0);
    if count >= OTP_VERIFY_WINDOW_MAX {
        return Err(AppError::TooManyRequests(
            "Too many failed verification attempts. Please try again later.".into(),
        ));
    }
    Ok(())
}

async fn record_verify_failure(state: &AppState, email: &str, purpose: &str) {
    let key = format!("auth:otp:verify-fail:{purpose}:{email}");
    if let Ok(mut conn) = state.redis.get_multiplexed_async_connection().await {
        let _: Result<i64, _> = increment_counter(&mut conn, &key, OTP_VERIFY_WINDOW_SECONDS).await;
    }
}

async fn clear_verify_failures(state: &AppState, email: &str, purpose: &str) {
    let key = format!("auth:otp:verify-fail:{purpose}:{email}");
    if let Ok(mut conn) = state.redis.get_multiplexed_async_connection().await {
        let _: Result<(), _> = conn.del(&key).await;
    }
}

async fn increment_counter(
    conn: &mut redis::aio::MultiplexedConnection,
    key: &str,
    ttl_seconds: usize,
) -> AppResult<i64> {
    let count: i64 = conn.incr(key, 1).await?;
    let _: bool = conn.expire(key, ttl_seconds as i64).await?;
    Ok(count)
}

fn otp_dispatch_response(state: &AppState, status: &'static str) -> OtpDispatchResponse {
    OtpDispatchResponse {
        status,
        expires_in_seconds: state.config.otp_ttl_seconds,
        retry_after_seconds: state.config.otp_resend_cooldown_seconds,
    }
}

fn compute_otp_hash(state: &AppState, email: &str, purpose: &str, otp: &str) -> AppResult<String> {
    if state.config.otp_hmac_secret.is_empty() {
        return Err(AppError::Internal(
            "OTP_HMAC_SECRET is not configured for OTP verification".into(),
        ));
    }

    let mut mac = HmacSha256::new_from_slice(state.config.otp_hmac_secret.as_bytes())
        .map_err(|error| AppError::Internal(format!("Failed to initialize OTP HMAC: {error}")))?;
    mac.update(format!("{purpose}:{email}:{otp}").as_bytes());
    Ok(hex::encode(mac.finalize().into_bytes()))
}

fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|error| AppError::Internal(format!("Failed to hash password: {error}")))
        .map(|hash| hash.to_string())
}

fn verify_password(hash: &str, password: &str) -> AppResult<()> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|error| AppError::Internal(format!("Invalid password hash: {error}")))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid credentials".into()))
}

fn validate_password(password: &str) -> AppResult<()> {
    if password.len() < 8 {
        return Err(AppError::BadRequest(
            "Password must be at least 8 characters".into(),
        ));
    }

    Ok(())
}

fn normalize_email(email: &str) -> AppResult<String> {
    let normalized = email.trim().to_lowercase();
    if normalized.is_empty() || !normalized.contains('@') {
        return Err(AppError::BadRequest("Invalid email address".into()));
    }
    Ok(normalized)
}

fn session_same_site(state: &AppState) -> SameSite {
    match state.config.session_cookie_same_site.to_ascii_lowercase().as_str() {
        "strict" => SameSite::Strict,
        "none" => SameSite::None,
        _ => SameSite::Lax,
    }
}

fn with_session_cookie(jar: CookieJar, state: &AppState, token: &str) -> CookieJar {
    let mut cookie = Cookie::build((state.config.session_cookie_name.clone(), token.to_string()))
        .http_only(true)
        .path("/")
        .secure(state.config.session_cookie_secure)
        .same_site(session_same_site(state));

    if let Some(domain) = &state.config.session_cookie_domain {
        cookie = cookie.domain(domain.clone());
    }

    jar.add(cookie.build())
}

fn clear_session_cookie(jar: CookieJar, state: &AppState) -> CookieJar {
    let mut cookie = Cookie::build((state.config.session_cookie_name.clone(), ""))
        .http_only(true)
        .path("/")
        .secure(state.config.session_cookie_secure)
        .same_site(session_same_site(state));

    if let Some(domain) = &state.config.session_cookie_domain {
        cookie = cookie.domain(domain.clone());
    }

    jar.remove(cookie.build())
}

fn normalize_optional(value: &Option<String>) -> Option<String> {
    value.as_ref().and_then(|value| {
        let sanitized = sanitize_text(value.trim());
        (!sanitized.is_empty() && sanitized.len() <= 100).then_some(sanitized)
    })
}

fn sanitize_text(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

fn normalize_otp(otp: &str) -> AppResult<String> {
    let normalized = otp.trim();
    if normalized.len() != 6
        || !normalized
            .chars()
            .all(|character| character.is_ascii_digit())
    {
        return Err(AppError::BadRequest("OTP must be a 6-digit code".into()));
    }
    Ok(normalized.to_string())
}

fn extract_client_ip(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("unknown")
        .to_string()
}

fn generate_otp_code() -> String {
    format!("{:06}", rand::thread_rng().gen_range(0..1_000_000))
}

fn generate_random_string(len: usize) -> String {
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        .chars()
        .collect();
    (0..len)
        .map(|_| chars[rng.gen_range(0..chars.len())])
        .collect()
}
