use crate::config::Config;
use crate::services::mailer::{BrevoMailer, Mailer};
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub redis: redis::Client,
    pub nats: async_nats::Client,
    pub config: Config,
    pub mailer: Arc<dyn Mailer>,
}

impl AppState {
    pub async fn new(config: Config) -> Result<Self, Box<dyn std::error::Error>> {
        let db = PgPool::connect(&config.database_url).await?;
        let redis = redis::Client::open(config.dragonfly_url.as_str())?;
        let nats = async_nats::connect(&config.nats_url).await?;
        let mailer: Arc<dyn Mailer> = Arc::new(BrevoMailer::new(&config)?);

        Ok(Self {
            db,
            redis,
            nats,
            config,
            mailer,
        })
    }
}
