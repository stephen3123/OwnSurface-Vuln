use serde_json::json;

use crate::errors::{AppError, AppResult};

/// Escape HTML special characters to prevent injection in email bodies.
fn html_escape(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}
use crate::services::alerts::Change;

/// Validate that a webhook URL points to a known safe external service.
/// Blocks SSRF to internal networks, AWS metadata, and non-HTTPS URLs.
fn validate_webhook_url(webhook_url: &str) -> AppResult<()> {
    // Must be HTTPS
    if !webhook_url.starts_with("https://") {
        return Err(AppError::BadRequest(
            "Webhook URL must use HTTPS".into(),
        ));
    }

    // Extract hostname from URL
    let host = webhook_url
        .strip_prefix("https://")
        .unwrap_or("")
        .split('/')
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("");

    // Block private/internal IPs and metadata endpoints
    let blocked_patterns = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "169.254.",
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.20.",
        "172.21.",
        "172.22.",
        "172.23.",
        "172.24.",
        "172.25.",
        "172.26.",
        "172.27.",
        "172.28.",
        "172.29.",
        "172.30.",
        "172.31.",
        "192.168.",
        "[::1]",
        "metadata.google",
    ];

    for pattern in &blocked_patterns {
        if host.contains(pattern) {
            return Err(AppError::BadRequest(
                "Webhook URL must not point to internal/private addresses".into(),
            ));
        }
    }

    // Allowlist known webhook domains
    let allowed_domains = [
        "hooks.slack.com",
        "discord.com",
        "discordapp.com",
    ];

    let is_allowed = allowed_domains.iter().any(|d| host.ends_with(d));
    if !is_allowed {
        return Err(AppError::BadRequest(
            "Webhook URL must be a Slack or Discord webhook endpoint".into(),
        ));
    }

    Ok(())
}

/// Send a Slack webhook notification with change details.
pub async fn send_slack_webhook(
    webhook_url: &str,
    url: &str,
    changes: &[Change],
) -> AppResult<()> {
    if webhook_url.is_empty() || changes.is_empty() {
        return Ok(());
    }

    validate_webhook_url(webhook_url)?;

    let change_blocks: Vec<serde_json::Value> = changes
        .iter()
        .map(|c| {
            let emoji = match c.change_type.as_str() {
                "tech_added" => ":heavy_plus_sign:",
                "tech_removed" => ":heavy_minus_sign:",
                "security_improved" => ":white_check_mark:",
                "security_degraded" => ":warning:",
                "ssl_expiring" => ":lock:",
                "seo_changed" => ":mag:",
                "sensitive_file_exposed" => ":rotating_light:",
                "cve_detected" => ":skull:",
                _ => ":bell:",
            };
            json!({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": format!("{} {}", emoji, c.description)
                }
            })
        })
        .collect();

    let mut blocks = vec![
        json!({
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": format!("OwnSurface: Changes detected on {}", url)
            }
        }),
        json!({ "type": "divider" }),
    ];
    blocks.extend(change_blocks);
    blocks.push(json!({
        "type": "context",
        "elements": [{
            "type": "mrkdwn",
            "text": format!("Detected by <https://ownsurface.com|OwnSurface> • {}", chrono::Utc::now().format("%Y-%m-%d %H:%M UTC"))
        }]
    }));

    let payload = json!({ "blocks": blocks });

    let client = reqwest::Client::new();
    let resp = client
        .post(webhook_url)
        .json(&payload)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;

    match resp {
        Ok(r) if r.status().is_success() => {
            tracing::info!(url, "Slack alert sent successfully");
            Ok(())
        }
        Ok(r) => {
            tracing::warn!(url, status = %r.status(), "Slack webhook returned non-success");
            Ok(())
        }
        Err(e) => {
            tracing::warn!(url, error = %e, "Slack webhook failed");
            Ok(())
        }
    }
}

/// Send a Discord webhook notification with change details.
pub async fn send_discord_webhook(
    webhook_url: &str,
    url: &str,
    changes: &[Change],
) -> AppResult<()> {
    if webhook_url.is_empty() || changes.is_empty() {
        return Ok(());
    }

    validate_webhook_url(webhook_url)?;

    let description = changes
        .iter()
        .map(|c| {
            let emoji = match c.change_type.as_str() {
                "tech_added" => "➕",
                "tech_removed" => "➖",
                "security_improved" => "✅",
                "security_degraded" => "⚠️",
                "ssl_expiring" => "🔒",
                "sensitive_file_exposed" => "🚨",
                "cve_detected" => "💀",
                _ => "🔔",
            };
            format!("{} {}", emoji, c.description)
        })
        .collect::<Vec<_>>()
        .join("\n");

    let payload = json!({
        "embeds": [{
            "title": format!("Changes detected on {}", url),
            "description": description,
            "color": 0x0d9488, // teal-600
            "footer": {
                "text": "OwnSurface Website Intelligence"
            },
            "timestamp": chrono::Utc::now().to_rfc3339()
        }]
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(webhook_url)
        .json(&payload)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;

    match resp {
        Ok(r) if r.status().is_success() => {
            tracing::info!(url, "Discord alert sent successfully");
            Ok(())
        }
        Ok(r) => {
            tracing::warn!(url, status = %r.status(), "Discord webhook returned non-success");
            Ok(())
        }
        Err(e) => {
            tracing::warn!(url, error = %e, "Discord webhook failed");
            Ok(())
        }
    }
}

/// Send an alert email via the Brevo API directly.
/// Does not depend on the Mailer trait — uses env config to call Brevo.
pub async fn send_alert_email_brevo(
    to: &str,
    url: &str,
    changes: &[Change],
) -> AppResult<()> {
    if to.is_empty() || changes.is_empty() {
        return Ok(());
    }

    let api_key = std::env::var("BREVO_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        tracing::debug!("Skipping alert email — BREVO_API_KEY not configured");
        return Ok(());
    }

    let from_email = std::env::var("BREVO_FROM_EMAIL")
        .unwrap_or_else(|_| "no-reply@ownsurface.com".into());
    let from_name = std::env::var("BREVO_FROM_NAME")
        .unwrap_or_else(|_| "OwnSurface".into());

    let change_html = changes
        .iter()
        .map(|c| {
            let color = match c.change_type.as_str() {
                "tech_added" => "#059669",
                "tech_removed" => "#dc2626",
                "security_degraded" | "sensitive_file_exposed" | "cve_detected" => "#dc2626",
                "security_improved" => "#059669",
                _ => "#6b7280",
            };
            // HTML-escape the description to prevent injection
            let escaped = html_escape(&c.description);
            format!(
                r#"<li style="color:{};margin:4px 0">{}</li>"#,
                color, escaped
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let escaped_url = html_escape(url);
    let subject = format!("OwnSurface: {} changes detected on {}", changes.len(), url);
    let body = format!(
        r#"<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
<h2 style="color:#0d9488">Changes Detected</h2>
<p>OwnSurface detected the following changes on <strong>{escaped_url}</strong>:</p>
<ul style="list-style:none;padding:0">{change_html}</ul>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="color:#6b7280;font-size:12px">
<a href="https://ownsurface.com/dashboard/watchlist" style="color:#0d9488">Manage watchlist</a>
&nbsp;•&nbsp; Sent by OwnSurface
</p></div>"#,
    );

    let email_payload = json!({
        "sender": { "name": from_name, "email": from_email },
        "to": [{ "email": to }],
        "subject": subject,
        "htmlContent": body,
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.brevo.com/v3/smtp/email")
        .header("api-key", &api_key)
        .header("Content-Type", "application/json")
        .json(&email_payload)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;

    match resp {
        Ok(r) if r.status().is_success() => {
            tracing::info!(to, url, "Alert email sent via Brevo");
            Ok(())
        }
        Ok(r) => {
            tracing::warn!(to, url, status = %r.status(), "Brevo alert email returned non-success");
            Ok(())
        }
        Err(e) => {
            tracing::warn!(to, url, error = %e, "Brevo alert email failed");
            Ok(())
        }
    }
}
