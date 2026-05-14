use crate::errors::{AppError, AppResult};
use crate::state::AppState;

pub async fn create_checkout_session(
    state: &AppState,
    customer_email: &str,
    price_id: &str,
    success_url: &str,
    cancel_url: &str,
    promotion_code: Option<&str>,
) -> AppResult<String> {
    let client = reqwest::Client::new();

    let mut params = vec![
        ("mode".to_string(), "subscription".to_string()),
        ("customer_email".to_string(), customer_email.to_string()),
        ("line_items[0][price]".to_string(), price_id.to_string()),
        ("line_items[0][quantity]".to_string(), "1".to_string()),
        ("success_url".to_string(), success_url.to_string()),
        ("cancel_url".to_string(), cancel_url.to_string()),
    ];

    // When a coupon ID is provided, auto-apply it and disable manual promo entry
    // (Stripe doesn't allow both discounts[] and allow_promotion_codes)
    // When no coupon, allow users to manually enter promo codes at checkout
    if let Some(coupon) = promotion_code {
        if !coupon.is_empty() {
            params.push(("discounts[0][coupon]".to_string(), coupon.to_string()));
        } else {
            params.push(("allow_promotion_codes".to_string(), "true".to_string()));
        }
    } else {
        params.push(("allow_promotion_codes".to_string(), "true".to_string()));
    }

    let response = client
        .post("https://api.stripe.com/v1/checkout/sessions")
        .header(
            "Authorization",
            format!("Bearer {}", state.config.stripe_secret_key),
        )
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::Stripe(format!("Failed to create checkout session: {}", e)))?;

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AppError::Stripe(format!("Failed to parse Stripe response: {}", e)))?;

    body["url"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::Stripe("No checkout URL in response".into()))
}

pub async fn create_portal_session(
    state: &AppState,
    customer_id: &str,
    return_url: &str,
) -> AppResult<String> {
    let client = reqwest::Client::new();

    let params = [("customer", customer_id), ("return_url", return_url)];

    let response = client
        .post("https://api.stripe.com/v1/billing_portal/sessions")
        .header(
            "Authorization",
            format!("Bearer {}", state.config.stripe_secret_key),
        )
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::Stripe(format!("Failed to create portal session: {}", e)))?;

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| AppError::Stripe(format!("Failed to parse Stripe response: {}", e)))?;

    body["url"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::Stripe("No portal URL in response".into()))
}

pub async fn cancel_subscription(state: &AppState, subscription_id: &str) -> AppResult<()> {
    let client = reqwest::Client::new();

    let response = client
        .delete(format!(
            "https://api.stripe.com/v1/subscriptions/{subscription_id}"
        ))
        .header(
            "Authorization",
            format!("Bearer {}", state.config.stripe_secret_key),
        )
        .send()
        .await
        .map_err(|e| AppError::Stripe(format!("Failed to cancel subscription: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(AppError::Stripe(format!(
            "Stripe API error cancelling subscription ({status}): {body}"
        )));
    }

    tracing::info!(subscription_id = %subscription_id, "stripe_subscription_cancelled");
    Ok(())
}

pub async fn handle_webhook_event(
    state: &AppState,
    event_type: &str,
    event_data: &serde_json::Value,
) -> AppResult<()> {
    match event_type {
        "checkout.session.completed" => {
            let customer_email = event_data["customer_details"]["email"]
                .as_str()
                .filter(|s| !s.is_empty());
            let customer_id = event_data["customer"]
                .as_str()
                .filter(|s| !s.is_empty());
            let subscription_id = event_data["subscription"].as_str();

            let customer_email = match customer_email {
                Some(email) => email,
                None => {
                    tracing::error!(
                        event_type = %event_type,
                        event_data = %event_data,
                        "Missing customer_details.email in checkout.session.completed webhook — cannot apply plan upgrade"
                    );
                    return Ok(());
                }
            };

            let customer_id = match customer_id {
                Some(id) => id,
                None => {
                    tracing::error!(
                        event_type = %event_type,
                        customer_email = %customer_email,
                        "Missing customer ID in checkout.session.completed webhook"
                    );
                    return Ok(());
                }
            };

            match crate::services::db::get_user_by_email(&state.db, customer_email).await? {
                Some(user) => {
                    crate::services::db::update_user_stripe(
                        &state.db,
                        user.id,
                        customer_id,
                        subscription_id,
                    )
                    .await?;
                    crate::services::db::update_user_plan(&state.db, user.id, "pro").await?;
                    tracing::info!(
                        user_id = %user.id,
                        customer_email = %customer_email,
                        customer_id = %customer_id,
                        "User upgraded to pro via checkout"
                    );
                }
                None => {
                    tracing::error!(
                        customer_email = %customer_email,
                        customer_id = %customer_id,
                        "Stripe checkout completed but no matching user found — plan upgrade lost"
                    );
                }
            }
        }
        "customer.subscription.updated" => {
            let customer_id = match event_data["customer"]
                .as_str()
                .filter(|s| !s.is_empty())
            {
                Some(id) => id,
                None => {
                    tracing::error!(
                        event_type = %event_type,
                        "Missing customer ID in subscription.updated webhook"
                    );
                    return Ok(());
                }
            };
            let status = event_data["status"]
                .as_str()
                .filter(|s| !s.is_empty())
                .unwrap_or("<missing>");

            tracing::info!(customer_id = %customer_id, status = %status, "Subscription status changed");

            // Restore Pro when subscription becomes active (e.g., payment recovery)
            if status == "active" {
                if let Some(user) =
                    crate::services::db::get_user_by_stripe_customer(&state.db, customer_id).await?
                {
                    if user.plan != "pro" {
                        crate::services::db::update_user_plan(&state.db, user.id, "pro").await?;
                        tracing::info!(user_id = %user.id, "User restored to pro after subscription reactivation");
                    }
                }
            }

            // Downgrade when subscription lapses (past_due, unpaid, incomplete_expired)
            if status == "past_due" || status == "unpaid" || status == "incomplete_expired" {
                if let Some(user) =
                    crate::services::db::get_user_by_stripe_customer(&state.db, customer_id).await?
                {
                    crate::services::db::update_user_plan(&state.db, user.id, "free").await?;
                    tracing::info!(
                        user_id = %user.id,
                        status = %status,
                        "User downgraded to free due to subscription status change"
                    );
                }
            }
        }
        "customer.subscription.deleted" => {
            let customer_id = match event_data["customer"]
                .as_str()
                .filter(|s| !s.is_empty())
            {
                Some(id) => id,
                None => {
                    tracing::error!(
                        event_type = %event_type,
                        "Missing customer ID in subscription.deleted webhook — cannot downgrade user"
                    );
                    return Ok(());
                }
            };

            tracing::info!(customer_id = %customer_id, "Subscription cancelled, downgrading to free");
            match crate::services::db::get_user_by_stripe_customer(&state.db, customer_id).await? {
                Some(user) => {
                    crate::services::db::update_user_plan(&state.db, user.id, "free").await?;
                    tracing::info!(user_id = %user.id, "User downgraded to free after subscription cancellation");
                }
                None => {
                    tracing::error!(
                        customer_id = %customer_id,
                        "Subscription deleted but no matching user found — user stuck on old plan"
                    );
                }
            }
        }
        _ => {
            tracing::debug!(event_type = %event_type, "Unhandled Stripe event");
        }
    }
    Ok(())
}
