use futures::StreamExt;
use std::time::Duration;
use tokio::time::timeout;

use crate::errors::{AppError, AppResult};
use crate::models::scan_result::ScanResult;
use crate::state::AppState;

/// Publish a scan request to NATS (fire-and-forget, used by bulk scans).
pub async fn publish_scan_request(state: &AppState, url: &str, url_hash: &str) -> AppResult<()> {
    let payload = serde_json::json!({
        "url": url,
        "url_hash": url_hash,
    });

    state
        .nats
        .publish("scan.request", payload.to_string().into())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to publish scan request: {}", e)))?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(url_hash = %url_hash, "Published scan request to NATS");
    Ok(())
}

/// Subscribe to the result subject FIRST, then publish the scan request, then
/// wait for the worker response. This eliminates the race condition where the
/// worker could respond before we start listening.
pub async fn publish_and_await_scan(
    state: &AppState,
    url: &str,
    url_hash: &str,
    timeout_secs: u64,
) -> AppResult<ScanResult> {
    let subject = format!("scan.result.{}", url_hash);

    // Step 1: Subscribe BEFORE publishing so we never miss the response
    let mut subscriber = state
        .nats
        .subscribe(subject.clone())
        .await
        .map_err(|e| AppError::Queue(format!("Failed to subscribe to {}: {}", subject, e)))?;

    tracing::info!(subject = %subject, "Subscribed to result subject");

    // Step 2: Now publish the scan request
    let payload = serde_json::json!({
        "url": url,
        "url_hash": url_hash,
    });

    state
        .nats
        .publish("scan.request", payload.to_string().into())
        .await
        .map_err(|e| {
            // Clean up subscription on publish failure
            let _ = subscriber.unsubscribe();
            AppError::Queue(format!("Failed to publish scan request: {}", e))
        })?;

    state
        .nats
        .flush()
        .await
        .map_err(|e| AppError::Queue(format!("Failed to flush NATS: {}", e)))?;

    tracing::info!(url_hash = %url_hash, "Published scan request to NATS");

    // Step 3: Wait for the result
    let result = timeout(Duration::from_secs(timeout_secs), subscriber.next())
        .await
        .map_err(|_| AppError::Queue("Scan timed out waiting for worker result".into()))?
        .ok_or_else(|| AppError::Queue("Subscriber closed unexpectedly".into()))?;

    let scan_result: ScanResult = serde_json::from_slice(&result.payload)?;

    // Unsubscribe
    let _ = subscriber.unsubscribe().await;

    Ok(scan_result)
}
