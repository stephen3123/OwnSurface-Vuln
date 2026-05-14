use std::env;

const INSECURE_JWT_SECRETS: &[&str] = &[
    "dev-secret-change-me",
    "secret",
    "jwt-secret",
    "changeme",
    "your-super-secret-jwt-key-change-in-production",
];

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub dragonfly_url: String,
    pub nats_url: String,
    pub jwt_secret: String,
    pub brevo_api_key: String,
    pub brevo_from_email: String,
    pub brevo_from_name: String,
    pub otp_hmac_secret: String,
    pub otp_ttl_seconds: i64,
    pub otp_resend_cooldown_seconds: i64,
    pub stripe_secret_key: String,
    pub stripe_webhook_secret: String,
    pub stripe_allowed_price_ids: Vec<String>,
    pub cors_origins: Vec<String>,
    pub session_cookie_name: String,
    pub session_cookie_domain: Option<String>,
    pub session_cookie_secure: bool,
    pub session_cookie_same_site: String,
    pub port: u16,
    pub sendgrid_api_key: String,
    pub aws_bedrock_region: String,
    pub bedrock_model_id: String,
    pub is_production: bool,
}

impl Config {
    pub fn from_env() -> Self {
        let is_production = env::var("RUST_ENV")
            .or_else(|_| env::var("NODE_ENV"))
            .map(|v| v == "production")
            .unwrap_or(false);

        let jwt_secret =
            env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".into());

        // In production, reject insecure JWT secrets
        if is_production {
            if INSECURE_JWT_SECRETS.contains(&jwt_secret.as_str()) || jwt_secret.len() < 32 {
                panic!("FATAL: JWT_SECRET is insecure. Set a strong random secret (>= 32 chars) in production.");
            }
        }

        let otp_hmac_secret = env::var("OTP_HMAC_SECRET").unwrap_or_default();
        if is_production && (otp_hmac_secret.is_empty() || otp_hmac_secret.len() < 32) {
            panic!("FATAL: OTP_HMAC_SECRET must be set to a strong random value (>= 32 chars) in production.");
        }

        let stripe_webhook_secret = env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_default();
        if is_production && stripe_webhook_secret.is_empty() {
            panic!("FATAL: STRIPE_WEBHOOK_SECRET must be set in production.");
        }

        // Parse allowed Stripe price IDs from env (comma-separated)
        let stripe_allowed_price_ids: Vec<String> = env::var("STRIPE_ALLOWED_PRICE_IDS")
            .unwrap_or_default()
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://xrayai:xrayai@localhost:5432/xrayai".into()),
            dragonfly_url: env::var("DRAGONFLY_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".into()),
            nats_url: env::var("NATS_URL").unwrap_or_else(|_| "nats://localhost:4222".into()),
            jwt_secret,
            brevo_api_key: env::var("BREVO_API_KEY").unwrap_or_default(),
            brevo_from_email: env::var("BREVO_FROM_EMAIL")
                .unwrap_or_else(|_| "no-reply@ownsurface.com".into()),
            brevo_from_name: env::var("BREVO_FROM_NAME")
                .unwrap_or_else(|_| "OwnSurface".into()),
            otp_hmac_secret,
            otp_ttl_seconds: env::var("OTP_TTL_SECONDS")
                .unwrap_or_else(|_| "600".into())
                .parse()
                .unwrap_or(600),
            otp_resend_cooldown_seconds: env::var("OTP_RESEND_COOLDOWN_SECONDS")
                .unwrap_or_else(|_| "60".into())
                .parse()
                .unwrap_or(60),
            stripe_secret_key: env::var("STRIPE_SECRET_KEY").unwrap_or_default(),
            stripe_webhook_secret,
            stripe_allowed_price_ids,
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".into())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            session_cookie_name: env::var("SESSION_COOKIE_NAME")
                .unwrap_or_else(|_| "ownsurface_session".into()),
            session_cookie_domain: env::var("SESSION_COOKIE_DOMAIN")
                .ok()
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty()),
            session_cookie_secure: env::var("SESSION_COOKIE_SECURE")
                .unwrap_or_else(|_| "false".into())
                .parse()
                .unwrap_or(false),
            session_cookie_same_site: env::var("SESSION_COOKIE_SAME_SITE")
                .unwrap_or_else(|_| "lax".into()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".into())
                .parse()
                .unwrap_or(8080),
            sendgrid_api_key: env::var("SENDGRID_API_KEY").unwrap_or_default(),
            aws_bedrock_region: env::var("AWS_BEDROCK_REGION").unwrap_or_else(|_| "us-east-1".into()),
            bedrock_model_id: env::var("BEDROCK_MODEL_ID").unwrap_or_else(|_| "us.anthropic.claude-haiku-4-5-20251001-v1:0".into()),
            is_production,
        }
    }
}
