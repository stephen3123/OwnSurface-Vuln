use redis::AsyncCommands;

use crate::errors::{AppError, AppResult};
use crate::models::scan_result::ScanResult;
use crate::state::AppState;

const SCAN_CACHE_TTL: u64 = 86400; // 24 hours

pub async fn get_cached_scan(state: &AppState, url_hash: &str) -> AppResult<Option<ScanResult>> {
    let mut conn = state.redis.get_multiplexed_async_connection().await?;
    let key = format!("scan:{}", url_hash);

    let cached: Option<String> = conn.get(&key).await?;

    match cached {
        Some(json_str) => {
            let result: ScanResult = serde_json::from_str(&json_str)?;
            Ok(Some(result))
        }
        None => Ok(None),
    }
}

pub async fn set_cached_scan(
    state: &AppState,
    url_hash: &str,
    result: &ScanResult,
) -> AppResult<()> {
    let mut conn = state.redis.get_multiplexed_async_connection().await?;
    let key = format!("scan:{}", url_hash);
    let json_str = serde_json::to_string(result)?;

    let _: () = conn.set_ex(&key, &json_str, SCAN_CACHE_TTL).await?;
    Ok(())
}

pub async fn increment_counter(state: &AppState, key: &str, ttl: u64) -> AppResult<i64> {
    let mut conn = state.redis.get_multiplexed_async_connection().await?;

    let count: i64 = redis::pipe()
        .atomic()
        .incr(key, 1i64)
        .expire(key, ttl as i64)
        .query_async::<Vec<i64>>(&mut conn)
        .await
        .map_err(|e| AppError::Cache(e))?
        .first()
        .copied()
        .unwrap_or(1);

    Ok(count)
}

pub async fn get_counter(state: &AppState, key: &str) -> AppResult<i64> {
    let mut conn = state.redis.get_multiplexed_async_connection().await?;
    let count: i64 = conn.get(key).await.unwrap_or(0);
    Ok(count)
}
