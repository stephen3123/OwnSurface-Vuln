use axum::{
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
    Extension, Json,
};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;

use crate::errors::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::services::{db, stripe};
use crate::state::AppState;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Deserialize)]
pub struct CheckoutRequest {
    pub price_id: String,
    pub success_url: String,
    pub cancel_url: String,
    #[serde(default)]
    pub promotion_code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PortalRequest {
    pub return_url: String,
}

pub async fn create_checkout(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<CheckoutRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Validate price_id against allowed Stripe price IDs
    if !state.config.stripe_allowed_price_ids.contains(&req.price_id) {
        return Err(AppError::BadRequest("Invalid price ID".into()));
    }

    let url = stripe::create_checkout_session(
        &state,
        &auth_user.email,
        &req.price_id,
        &req.success_url,
        &req.cancel_url,
        req.promotion_code.as_deref(),
    )
    .await?;

    Ok(Json(serde_json::json!({ "url": url })))
}

pub async fn create_portal(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
    Json(req): Json<PortalRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let user = db::get_user_by_id(&state.db, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    let customer_id = user
        .stripe_customer_id
        .ok_or_else(|| AppError::BadRequest("No Stripe customer found. Subscribe first.".into()))?;

    let url = stripe::create_portal_session(&state, &customer_id, &req.return_url).await?;

    Ok(Json(serde_json::json!({ "url": url })))
}

pub async fn stripe_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> AppResult<StatusCode> {
    let signature_header = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::BadRequest("Missing Stripe signature".into()))?;

    // Verify webhook signature using HMAC-SHA256
    verify_stripe_signature(&body, signature_header, &state.config.stripe_webhook_secret)?;

    let event: serde_json::Value = serde_json::from_slice(&body)?;

    let event_type = event["type"]
        .as_str()
        .ok_or_else(|| AppError::BadRequest("Missing event type".into()))?;

    let event_data = &event["data"]["object"];

    stripe::handle_webhook_event(&state, event_type, event_data).await?;

    Ok(StatusCode::OK)
}

/// Verify Stripe webhook signature (v1 scheme).
/// Stripe signs using HMAC-SHA256 over "timestamp.body" and sends:
///   Stripe-Signature: t=<timestamp>,v1=<signature>[,v0=<old_signature>]
/// We verify v1 signatures and reject if timestamp is older than 5 minutes.
fn verify_stripe_signature(body: &[u8], sig_header: &str, secret: &str) -> AppResult<()> {
    if secret.is_empty() {
        return Err(AppError::Internal(
            "STRIPE_WEBHOOK_SECRET is not configured".into(),
        ));
    }

    let mut timestamp: Option<&str> = None;
    let mut signatures: Vec<&str> = Vec::new();

    for part in sig_header.split(',') {
        let part = part.trim();
        if let Some(ts) = part.strip_prefix("t=") {
            timestamp = Some(ts);
        } else if let Some(sig) = part.strip_prefix("v1=") {
            signatures.push(sig);
        }
    }

    let timestamp = timestamp
        .ok_or_else(|| AppError::BadRequest("Missing timestamp in Stripe signature".into()))?;

    if signatures.is_empty() {
        return Err(AppError::BadRequest(
            "Missing v1 signature in Stripe signature header".into(),
        ));
    }

    // Reject timestamps older than 5 minutes to prevent replay attacks
    let ts: i64 = timestamp
        .parse()
        .map_err(|_| AppError::BadRequest("Invalid timestamp in Stripe signature".into()))?;
    let now = chrono::Utc::now().timestamp();
    if (now - ts).abs() > 300 {
        return Err(AppError::BadRequest(
            "Stripe webhook timestamp too old (possible replay attack)".into(),
        ));
    }

    // Compute expected signature: HMAC-SHA256(secret, "timestamp.body")
    let signed_payload = format!("{timestamp}.");
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("Failed to init HMAC for Stripe: {e}")))?;
    mac.update(signed_payload.as_bytes());
    mac.update(body);
    let expected = hex::encode(mac.finalize().into_bytes());

    // Constant-time comparison against all v1 signatures
    let valid = signatures.iter().any(|sig| {
        if sig.len() != expected.len() {
            return false;
        }
        // Constant-time comparison to prevent timing attacks
        let mut result = 0u8;
        for (a, b) in sig.bytes().zip(expected.bytes()) {
            result |= a ^ b;
        }
        result == 0
    });

    if !valid {
        return Err(AppError::BadRequest(
            "Invalid Stripe webhook signature".into(),
        ));
    }

    Ok(())
}
