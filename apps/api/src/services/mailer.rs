use async_trait::async_trait;
use reqwest::Client;
use serde_json::json;

use crate::{
    config::Config,
    errors::{AppError, AppResult},
};

#[async_trait]
pub trait Mailer: Send + Sync {
    async fn send_registration_otp(
        &self,
        email: &str,
        code: &str,
        expires_in_minutes: i64,
    ) -> AppResult<()>;

    async fn send_password_reset_otp(
        &self,
        email: &str,
        code: &str,
        expires_in_minutes: i64,
    ) -> AppResult<()>;

    async fn send_welcome_email(&self, email: &str, name: Option<&str>) -> AppResult<()>;
}

pub struct BrevoMailer {
    client: Client,
    api_key: String,
    from_email: String,
    from_name: String,
}

impl BrevoMailer {
    pub fn new(config: &Config) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            client: Client::new(),
            api_key: config.brevo_api_key.clone(),
            from_email: config.brevo_from_email.clone(),
            from_name: config.brevo_from_name.clone(),
        })
    }

    async fn send_auth_email(
        &self,
        email: &str,
        subject: &str,
        heading: &str,
        code: &str,
        expires_in_minutes: i64,
    ) -> AppResult<()> {
        if self.api_key.is_empty() {
            return Err(AppError::Internal(
                "BREVO_API_KEY is not configured for OTP delivery".into(),
            ));
        }

        let text_body = format!(
            "{heading}\n\nYour one-time code is: {code}\n\nThis code expires in {expires_in_minutes} minutes. If you did not request this email, you can ignore it."
        );

        let html_body = format!(
            "<!doctype html><html><body style=\"margin:0;padding:24px;background:#f4f7f7;font-family:Arial,sans-serif;color:#102226;\">\
            <div style=\"max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #d9e4e5;\">\
            <div style=\"font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5a7377;margin-bottom:16px;\">OwnSurface security</div>\
            <h1 style=\"margin:0 0 12px;font-size:28px;line-height:1.1;color:#102226;\">{heading}</h1>\
            <p style=\"margin:0 0 24px;font-size:15px;line-height:1.7;color:#4e676b;\">Use the code below to continue. It expires in {expires_in_minutes} minutes.</p>\
            <div style=\"margin:0 0 24px;padding:18px 20px;border-radius:14px;background:#0f1d1f;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:0.24em;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;\">{code}</div>\
            <p style=\"margin:0;font-size:14px;line-height:1.7;color:#4e676b;\">If you didn't request this, you can safely ignore this email.</p>\
            </div></body></html>"
        );

        let body = json!({
            "sender": {
                "name": self.from_name,
                "email": self.from_email
            },
            "to": [{ "email": email }],
            "subject": subject,
            "htmlContent": html_body,
            "textContent": text_body
        });

        let response = self
            .client
            .post("https://api.brevo.com/v3/smtp/email")
            .header("api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Brevo request failed: {e}")))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".into());
            return Err(AppError::Internal(format!(
                "Brevo API error ({status}): {error_body}"
            )));
        }

        tracing::info!(email = %email, subject = %subject, "otp_email_sent_via_brevo");
        Ok(())
    }
}

#[async_trait]
impl Mailer for BrevoMailer {
    async fn send_registration_otp(
        &self,
        email: &str,
        code: &str,
        expires_in_minutes: i64,
    ) -> AppResult<()> {
        self.send_auth_email(
            email,
            "Verify your OwnSurface email",
            "Verify your email",
            code,
            expires_in_minutes,
        )
        .await
    }

    async fn send_password_reset_otp(
        &self,
        email: &str,
        code: &str,
        expires_in_minutes: i64,
    ) -> AppResult<()> {
        self.send_auth_email(
            email,
            "Reset your OwnSurface password",
            "Reset your password",
            code,
            expires_in_minutes,
        )
        .await
    }

    async fn send_welcome_email(&self, email: &str, name: Option<&str>) -> AppResult<()> {
        if self.api_key.is_empty() {
            return Ok(()); // Silently skip if not configured
        }

        let greeting = name
            .filter(|n| !n.is_empty())
            .map(|n| format!("Hi {n}"))
            .unwrap_or_else(|| "Welcome".to_string());

        let subject = "Welcome to OwnSurface — your first scan awaits";

        let text_body = format!(
            "{greeting},\n\n\
            Your OwnSurface account is ready. Here's how to get started:\n\n\
            1. Run your first scan — enter any URL in the dashboard and get a full intelligence report in 30 seconds.\n\
            2. Install the Chrome extension — scan any website while you browse.\n\
            3. Set up a watchlist — monitor domains for tech stack, security, or content changes.\n\n\
            Your free plan includes 5 scans per day with all 26 scanner modules. No feature gating.\n\n\
            If you need unlimited scans, monitoring, attack surface auditing, or team access, upgrade to Pro for $49/month.\n\n\
            Questions? Reply to this email — we read every message.\n\n\
            — The OwnSurface Team"
        );

        let html_body = format!(
            "<!doctype html><html><body style=\"margin:0;padding:24px;background:#f4f7f7;font-family:Arial,sans-serif;color:#102226;\">\
            <div style=\"max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #d9e4e5;\">\
            <div style=\"font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5a7377;margin-bottom:16px;\">OwnSurface</div>\
            <h1 style=\"margin:0 0 16px;font-size:26px;line-height:1.2;color:#102226;\">{greeting}, your workspace is ready</h1>\
            <p style=\"margin:0 0 24px;font-size:15px;line-height:1.8;color:#4e676b;\">Here's how to get the most out of OwnSurface:</p>\
            <div style=\"margin:0 0 12px;padding:16px 20px;border-radius:14px;background:#f0fdf9;border:1px solid #d1fae5;\">\
            <div style=\"font-size:13px;font-weight:700;color:#0f766e;margin-bottom:4px;\">1. Run your first scan</div>\
            <div style=\"font-size:14px;color:#4e676b;\">Enter any URL in the dashboard — get tech stack, security posture, SEO health, and traffic signals in 30 seconds.</div>\
            </div>\
            <div style=\"margin:0 0 12px;padding:16px 20px;border-radius:14px;background:#f0fdf9;border:1px solid #d1fae5;\">\
            <div style=\"font-size:13px;font-weight:700;color:#0f766e;margin-bottom:4px;\">2. Install the Chrome extension</div>\
            <div style=\"font-size:14px;color:#4e676b;\">Scan any website while you browse — one click, instant intelligence.</div>\
            </div>\
            <div style=\"margin:0 0 24px;padding:16px 20px;border-radius:14px;background:#f0fdf9;border:1px solid #d1fae5;\">\
            <div style=\"font-size:13px;font-weight:700;color:#0f766e;margin-bottom:4px;\">3. Set up a watchlist</div>\
            <div style=\"font-size:14px;color:#4e676b;\">Monitor competitor or client domains for changes in tech stack, security headers, or content.</div>\
            </div>\
            <a href=\"https://ownsurface.com/dashboard\" style=\"display:inline-block;padding:14px 28px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;\">Open your dashboard</a>\
            <p style=\"margin:24px 0 0;font-size:13px;line-height:1.7;color:#8fa4a7;\">Free plan: 5 scans/day, all 26 modules, Chrome extension, 1 watchlist. <a href=\"https://ownsurface.com/pricing\" style=\"color:#0f766e;\">Upgrade to Pro</a> for unlimited.</p>\
            </div></body></html>"
        );

        let body = json!({
            "sender": {
                "name": self.from_name,
                "email": self.from_email
            },
            "to": [{ "email": email }],
            "subject": subject,
            "htmlContent": html_body,
            "textContent": text_body
        });

        let response = self
            .client
            .post("https://api.brevo.com/v3/smtp/email")
            .header("api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Brevo request failed: {e}")))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_body = response.text().await.unwrap_or_default();
            tracing::warn!(email = %email, status = %status, "welcome_email_failed: {error_body}");
            return Ok(()); // Don't fail registration if welcome email fails
        }

        tracing::info!(email = %email, "welcome_email_sent");
        Ok(())
    }
}
