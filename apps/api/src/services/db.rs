use chrono::Utc;
use sha2::Digest;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppResult;
use crate::models::collection::{Collection, CollectionItem};
use crate::models::follow::{Follow, Notification};
use crate::models::leaderboard::{Achievement, Badge, UserStats};
use crate::models::report::Report;
use crate::models::scan_result::ScanRow;
use crate::models::user::{ApiKey, AuthOtp, User};
use crate::models::watchlist::{Watchlist, WatchlistChange};

// ─── Users ───

pub async fn create_user(
    pool: &PgPool,
    email: &str,
    password_hash: &str,
    name: Option<&str>,
    email_verified_at: Option<chrono::DateTime<Utc>>,
) -> AppResult<User> {
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash, name, email_verified_at) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(email)
    .bind(password_hash)
    .bind(name)
    .bind(email_verified_at)
    .fetch_one(pool)
    .await?;
    Ok(user)
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> AppResult<Option<User>> {
    let user =
        sqlx::query_as::<_, User>("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1")
            .bind(email)
            .fetch_optional(pool)
            .await?;
    Ok(user)
}

pub async fn get_user_by_stripe_customer(
    pool: &PgPool,
    customer_id: &str,
) -> AppResult<Option<User>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE stripe_customer_id = $1 LIMIT 1",
    )
    .bind(customer_id)
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> AppResult<Option<User>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(user)
}

pub async fn update_user_plan(pool: &PgPool, user_id: Uuid, plan: &str) -> AppResult<()> {
    sqlx::query("UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2")
        .bind(plan)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_user_stripe(
    pool: &PgPool,
    user_id: Uuid,
    customer_id: &str,
    subscription_id: Option<&str>,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE users SET stripe_customer_id = $1, stripe_subscription_id = $2, updated_at = NOW() WHERE id = $3",
    )
    .bind(customer_id)
    .bind(subscription_id)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_user_registration_details(
    pool: &PgPool,
    user_id: Uuid,
    password_hash: &str,
    name: Option<&str>,
) -> AppResult<User> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET password_hash = $2, name = $3, updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(user_id)
    .bind(password_hash)
    .bind(name)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn mark_user_email_verified(pool: &PgPool, user_id: Uuid) -> AppResult<User> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn update_user_password_hash(
    pool: &PgPool,
    user_id: Uuid,
    password_hash: &str,
) -> AppResult<()> {
    sqlx::query("UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1")
        .bind(user_id)
        .bind(password_hash)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn update_user_name(
    pool: &PgPool,
    user_id: Uuid,
    name: Option<&str>,
) -> AppResult<()> {
    sqlx::query("UPDATE users SET name = $2, updated_at = NOW() WHERE id = $1")
        .bind(user_id)
        .bind(name)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn upsert_notification_prefs(
    pool: &PgPool,
    user_id: Uuid,
    prefs: &serde_json::Value,
) -> AppResult<()> {
    sqlx::query(
        "INSERT INTO notification_preferences (user_id, preferences, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET preferences = $2, updated_at = NOW()",
    )
    .bind(user_id)
    .bind(prefs)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_notification_prefs(
    pool: &PgPool,
    user_id: Uuid,
) -> AppResult<Option<serde_json::Value>> {
    let row: Option<(serde_json::Value,)> = sqlx::query_as(
        "SELECT preferences FROM notification_preferences WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| r.0))
}

pub async fn delete_user(pool: &PgPool, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn reset_api_key_daily_counters(pool: &PgPool) -> AppResult<u64> {
    let result = sqlx::query(
        "UPDATE api_keys SET requests_today = 0, requests_reset_at = NOW() WHERE requests_today > 0",
    )
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}

// ─── Auth OTPs ───

pub async fn invalidate_active_auth_otps(
    pool: &PgPool,
    email: &str,
    purpose: &str,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE auth_otps SET consumed_at = NOW() WHERE LOWER(email) = LOWER($1) AND purpose = $2 AND consumed_at IS NULL",
    )
    .bind(email)
    .bind(purpose)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn create_auth_otp(
    pool: &PgPool,
    email: &str,
    purpose: &str,
    code_hash: &str,
    expires_at: chrono::DateTime<Utc>,
    max_attempts: i32,
) -> AppResult<AuthOtp> {
    let otp = sqlx::query_as::<_, AuthOtp>(
        "INSERT INTO auth_otps (email, purpose, code_hash, expires_at, max_attempts, last_sent_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
    )
    .bind(email)
    .bind(purpose)
    .bind(code_hash)
    .bind(expires_at)
    .bind(max_attempts)
    .fetch_one(pool)
    .await?;

    Ok(otp)
}

pub async fn get_latest_auth_otp(
    pool: &PgPool,
    email: &str,
    purpose: &str,
) -> AppResult<Option<AuthOtp>> {
    let otp = sqlx::query_as::<_, AuthOtp>(
        "SELECT * FROM auth_otps WHERE LOWER(email) = LOWER($1) AND purpose = $2 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(email)
    .bind(purpose)
    .fetch_optional(pool)
    .await?;

    Ok(otp)
}

pub async fn increment_auth_otp_attempt(pool: &PgPool, otp_id: Uuid) -> AppResult<AuthOtp> {
    let otp = sqlx::query_as::<_, AuthOtp>(
        "UPDATE auth_otps SET attempt_count = attempt_count + 1 WHERE id = $1 RETURNING *",
    )
    .bind(otp_id)
    .fetch_one(pool)
    .await?;

    Ok(otp)
}

pub async fn consume_auth_otp(pool: &PgPool, otp_id: Uuid) -> AppResult<()> {
    sqlx::query("UPDATE auth_otps SET consumed_at = NOW() WHERE id = $1")
        .bind(otp_id)
        .execute(pool)
        .await?;

    Ok(())
}

// ─── Scans ───

pub async fn create_scan(
    pool: &PgPool,
    url: &str,
    url_hash: &str,
    user_id: Option<Uuid>,
    result: &serde_json::Value,
) -> AppResult<ScanRow> {
    let scan = sqlx::query_as::<_, ScanRow>(
        "INSERT INTO scans (url, url_hash, user_id, result) VALUES ($1, $2, $3, $4) RETURNING id, url, url_hash, result, scanned_at, expires_at",
    )
    .bind(url)
    .bind(url_hash)
    .bind(user_id)
    .bind(result)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_scan_by_hash(pool: &PgPool, url_hash: &str) -> AppResult<Option<ScanRow>> {
    let scan = sqlx::query_as::<_, ScanRow>(
        "SELECT id, url, url_hash, result, scanned_at, expires_at FROM scans WHERE url_hash = $1 AND expires_at > NOW() ORDER BY scanned_at DESC LIMIT 1",
    )
    .bind(url_hash)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_recent_scans(pool: &PgPool, user_id: Uuid, limit: i64) -> AppResult<Vec<ScanRow>> {
    let scans = sqlx::query_as::<_, ScanRow>(
        "SELECT id, url, url_hash, result, scanned_at, expires_at FROM scans WHERE user_id = $1 ORDER BY scanned_at DESC LIMIT $2",
    )
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn get_latest_scans_for_urls(
    pool: &PgPool,
    user_id: Uuid,
    urls: &[String],
) -> AppResult<Vec<ScanRow>> {
    if urls.is_empty() {
        return Ok(Vec::new());
    }

    let scans = sqlx::query_as::<_, ScanRow>(
        "SELECT DISTINCT ON (url) id, url, url_hash, result, scanned_at, expires_at
         FROM scans
         WHERE user_id = $1 AND url = ANY($2)
         ORDER BY url, scanned_at DESC",
    )
    .bind(user_id)
    .bind(urls)
    .fetch_all(pool)
    .await?;

    Ok(scans)
}

// ─── Scan History ───

pub async fn create_scan_history(
    pool: &PgPool,
    url: &str,
    url_hash: &str,
    user_id: Option<Uuid>,
    result: &serde_json::Value,
) -> AppResult<()> {
    sqlx::query(
        "INSERT INTO scan_history (url, url_hash, user_id, result) VALUES ($1, $2, $3, $4)",
    )
    .bind(url)
    .bind(url_hash)
    .bind(user_id)
    .bind(result)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_scan_history(
    pool: &PgPool,
    url_hash: &str,
    limit: i64,
) -> AppResult<Vec<ScanRow>> {
    let history = sqlx::query_as::<_, ScanRow>(
        "SELECT id, url, url_hash, result, scanned_at, scanned_at as expires_at FROM scan_history WHERE url_hash = $1 ORDER BY scanned_at DESC LIMIT $2",
    )
    .bind(url_hash)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(history)
}

pub async fn get_scan_history_within_days(
    pool: &PgPool,
    url_hash: &str,
    limit: i64,
    days: i32,
) -> AppResult<Vec<ScanRow>> {
    let history = sqlx::query_as::<_, ScanRow>(
        "SELECT id, url, url_hash, result, scanned_at, scanned_at as expires_at FROM scan_history WHERE url_hash = $1 AND scanned_at >= NOW() - make_interval(days => $3) ORDER BY scanned_at DESC LIMIT $2",
    )
    .bind(url_hash)
    .bind(limit)
    .bind(days)
    .fetch_all(pool)
    .await?;
    Ok(history)
}

// ─── Watchlists ───

pub async fn create_watchlist(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    urls: &[String],
    check_interval: i32,
    alert_email: bool,
    alert_slack_webhook: Option<&str>,
) -> AppResult<Watchlist> {
    let wl = sqlx::query_as::<_, Watchlist>(
        "INSERT INTO watchlists (user_id, name, urls, check_interval, alert_email, alert_slack_webhook) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(user_id)
    .bind(name)
    .bind(urls)
    .bind(check_interval)
    .bind(alert_email)
    .bind(alert_slack_webhook)
    .fetch_one(pool)
    .await?;
    Ok(wl)
}

pub async fn get_watchlists(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Watchlist>> {
    let wls = sqlx::query_as::<_, Watchlist>(
        "SELECT * FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(wls)
}

pub async fn get_watchlist_by_id(pool: &PgPool, id: Uuid) -> AppResult<Option<Watchlist>> {
    let wl = sqlx::query_as::<_, Watchlist>("SELECT * FROM watchlists WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(wl)
}

pub async fn update_watchlist(
    pool: &PgPool,
    id: Uuid,
    name: Option<&str>,
    urls: Option<&[String]>,
    check_interval: Option<i32>,
    alert_email: Option<bool>,
) -> AppResult<Watchlist> {
    let wl = sqlx::query_as::<_, Watchlist>(
        "UPDATE watchlists SET name = COALESCE($2, name), urls = COALESCE($3, urls), check_interval = COALESCE($4, check_interval), alert_email = COALESCE($5, alert_email), updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(name)
    .bind(urls)
    .bind(check_interval)
    .bind(alert_email)
    .fetch_one(pool)
    .await?;
    Ok(wl)
}

pub async fn delete_watchlist(pool: &PgPool, id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM watchlists WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_watchlist_changes(
    pool: &PgPool,
    watchlist_id: Uuid,
    limit: i64,
) -> AppResult<Vec<WatchlistChange>> {
    let changes = sqlx::query_as::<_, WatchlistChange>(
        "SELECT * FROM watchlist_changes WHERE watchlist_id = $1 ORDER BY detected_at DESC LIMIT $2",
    )
    .bind(watchlist_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(changes)
}

// ─── Reports ───

pub async fn create_report(
    pool: &PgPool,
    user_id: Uuid,
    url: &str,
    title: Option<&str>,
    scan_result: &serde_json::Value,
    is_public: bool,
) -> AppResult<Report> {
    let slug = if is_public {
        Some(generate_slug())
    } else {
        None
    };

    let report = sqlx::query_as::<_, Report>(
        "INSERT INTO reports (user_id, url, title, scan_result, is_public, slug) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(user_id)
    .bind(url)
    .bind(title)
    .bind(scan_result)
    .bind(is_public)
    .bind(&slug)
    .fetch_one(pool)
    .await?;
    Ok(report)
}

pub async fn get_report_by_id(pool: &PgPool, id: Uuid) -> AppResult<Option<Report>> {
    let report = sqlx::query_as::<_, Report>("SELECT * FROM reports WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(report)
}

pub async fn get_report_by_slug(pool: &PgPool, slug: &str) -> AppResult<Option<Report>> {
    // Use a CTE to atomically read and increment views in one statement
    let report = sqlx::query_as::<_, Report>(
        "WITH updated AS (
            UPDATE reports SET views = views + 1
            WHERE slug = $1 AND is_public = true
            RETURNING *
        )
        SELECT * FROM updated",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    Ok(report)
}

pub async fn get_user_reports(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Report>> {
    let reports = sqlx::query_as::<_, Report>(
        "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(reports)
}

// ─── API Keys ───

pub fn hash_api_key(key: &str) -> String {
    let mut hasher = sha2::Sha256::new();
    hasher.update(key.as_bytes());
    hex::encode(hasher.finalize())
}

pub async fn create_api_key(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    key_hash: &str,
    key_prefix: &str,
) -> AppResult<ApiKey> {
    let key = sqlx::query_as::<_, ApiKey>(
        "INSERT INTO api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(user_id)
    .bind(key_hash)
    .bind(key_prefix)
    .bind(name)
    .fetch_one(pool)
    .await?;
    Ok(key)
}

pub async fn get_user_api_keys(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<ApiKey>> {
    let keys = sqlx::query_as::<_, ApiKey>(
        "SELECT * FROM api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(keys)
}

pub async fn validate_api_key(pool: &PgPool, key_hash: &str) -> AppResult<Option<ApiKey>> {
    let key = sqlx::query_as::<_, ApiKey>(
        "UPDATE api_keys SET last_used_at = NOW(), requests_today = requests_today + 1 WHERE key_hash = $1 AND is_active = true RETURNING *",
    )
    .bind(key_hash)
    .fetch_optional(pool)
    .await?;
    Ok(key)
}

pub async fn delete_api_key(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Monthly usage counters (for Free plan limits) ───

pub async fn count_user_deep_scans_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM deep_scans WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

pub async fn count_user_attack_surface_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM attack_surface_audits WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

pub async fn count_user_bulk_jobs_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM bulk_jobs WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

pub async fn count_user_uptime_monitors(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM uptime_monitors WHERE user_id = $1 AND is_active = true",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

pub async fn count_user_ssl_monitors(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM ssl_monitors WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

pub async fn count_user_verified_domains(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let count: Option<i64> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM domain_verifications WHERE user_id = $1 AND verified = true",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.unwrap_or(0))
}

// ─── Bulk Jobs ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct BulkJob {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub status: String,
    pub total_urls: i32,
    pub completed_urls: i32,
    pub failed_urls: i32,
    pub urls: Vec<String>,
    pub results: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<Utc>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
}

pub async fn create_bulk_job(pool: &PgPool, user_id: Uuid, urls: &[String]) -> AppResult<BulkJob> {
    let job = sqlx::query_as::<_, BulkJob>(
        "INSERT INTO bulk_jobs (user_id, total_urls, urls) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(user_id)
    .bind(urls.len() as i32)
    .bind(urls)
    .fetch_one(pool)
    .await?;
    Ok(job)
}

pub async fn get_bulk_job(pool: &PgPool, id: Uuid) -> AppResult<Option<BulkJob>> {
    let job = sqlx::query_as::<_, BulkJob>("SELECT * FROM bulk_jobs WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(job)
}

pub async fn get_user_bulk_jobs(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<BulkJob>> {
    let jobs = sqlx::query_as::<_, BulkJob>(
        "SELECT * FROM bulk_jobs WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(jobs)
}

// ─── Radar Events ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct RadarEvent {
    pub id: Uuid,
    pub event_type: String,
    pub technology: Option<String>,
    pub category: Option<String>,
    pub affected_urls: Vec<String>,
    pub count: i32,
    pub details: Option<serde_json::Value>,
    pub detected_at: chrono::DateTime<Utc>,
}

pub async fn get_radar_events(
    pool: &PgPool,
    event_type: Option<&str>,
    technology: Option<&str>,
    limit: i64,
) -> AppResult<Vec<RadarEvent>> {
    let events = sqlx::query_as::<_, RadarEvent>(
        "SELECT * FROM radar_events WHERE ($1::text IS NULL OR event_type = $1) AND ($2::text IS NULL OR technology = $2) ORDER BY detected_at DESC LIMIT $3",
    )
    .bind(event_type)
    .bind(technology)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(events)
}

// ─── User Profiles ───

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> AppResult<Option<User>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(username)
        .fetch_optional(pool)
        .await?;
    Ok(user)
}

pub async fn update_user_profile(
    pool: &PgPool,
    user_id: Uuid,
    username: Option<&str>,
    bio: Option<&str>,
    avatar_url: Option<&str>,
    is_public: Option<bool>,
) -> AppResult<User> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET username = COALESCE($2, username), bio = COALESCE($3, bio), avatar_url = COALESCE($4, avatar_url), is_public = COALESCE($5, is_public), updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(user_id)
    .bind(username)
    .bind(bio)
    .bind(avatar_url)
    .bind(is_public)
    .fetch_one(pool)
    .await?;
    Ok(user)
}

// ─── Follows ───

pub async fn create_follow_user(
    pool: &PgPool,
    follower_id: Uuid,
    following_id: Uuid,
) -> AppResult<Follow> {
    let follow = sqlx::query_as::<_, Follow>(
        "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO UPDATE SET created_at = follows.created_at RETURNING *",
    )
    .bind(follower_id)
    .bind(following_id)
    .fetch_one(pool)
    .await?;
    // Update follower count
    sqlx::query("INSERT INTO user_stats (user_id, total_followers) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET total_followers = user_stats.total_followers + 1")
        .bind(following_id)
        .execute(pool)
        .await?;
    Ok(follow)
}

pub async fn delete_follow_user(
    pool: &PgPool,
    follower_id: Uuid,
    following_id: Uuid,
) -> AppResult<()> {
    let result = sqlx::query("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2")
        .bind(follower_id)
        .bind(following_id)
        .execute(pool)
        .await?;
    if result.rows_affected() > 0 {
        sqlx::query("UPDATE user_stats SET total_followers = GREATEST(0, total_followers - 1) WHERE user_id = $1")
            .bind(following_id)
            .execute(pool)
            .await?;
    }
    Ok(())
}

pub async fn create_follow_domain(
    pool: &PgPool,
    follower_id: Uuid,
    domain: &str,
) -> AppResult<Follow> {
    let follow = sqlx::query_as::<_, Follow>(
        "INSERT INTO follows (follower_id, following_domain) VALUES ($1, $2) ON CONFLICT (follower_id, following_domain) DO UPDATE SET created_at = follows.created_at RETURNING *",
    )
    .bind(follower_id)
    .bind(domain)
    .fetch_one(pool)
    .await?;
    Ok(follow)
}

pub async fn delete_follow_domain(pool: &PgPool, follower_id: Uuid, domain: &str) -> AppResult<()> {
    sqlx::query("DELETE FROM follows WHERE follower_id = $1 AND following_domain = $2")
        .bind(follower_id)
        .bind(domain)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_following(
    pool: &PgPool,
    user_id: Uuid,
    follow_type: Option<&str>,
) -> AppResult<Vec<Follow>> {
    let query = match follow_type {
        Some("users") => "SELECT * FROM follows WHERE follower_id = $1 AND following_id IS NOT NULL ORDER BY created_at DESC",
        Some("domains") => "SELECT * FROM follows WHERE follower_id = $1 AND following_domain IS NOT NULL ORDER BY created_at DESC",
        _ => "SELECT * FROM follows WHERE follower_id = $1 ORDER BY created_at DESC",
    };
    let follows = sqlx::query_as::<_, Follow>(query)
        .bind(user_id)
        .fetch_all(pool)
        .await?;
    Ok(follows)
}

pub async fn get_followers(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Follow>> {
    let follows = sqlx::query_as::<_, Follow>(
        "SELECT * FROM follows WHERE following_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(follows)
}

// ─── Notifications ───

pub async fn create_notification(
    pool: &PgPool,
    user_id: Uuid,
    notification_type: &str,
    actor_id: Option<Uuid>,
    target_id: Option<Uuid>,
    content: Option<&str>,
) -> AppResult<Notification> {
    let n = sqlx::query_as::<_, Notification>(
        "INSERT INTO notifications (user_id, type, actor_id, target_id, content) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(user_id)
    .bind(notification_type)
    .bind(actor_id)
    .bind(target_id)
    .bind(content)
    .fetch_one(pool)
    .await?;
    Ok(n)
}

pub async fn get_notifications(
    pool: &PgPool,
    user_id: Uuid,
    unread_only: bool,
) -> AppResult<Vec<Notification>> {
    let query = if unread_only {
        "SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY created_at DESC LIMIT 50"
    } else {
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
    };
    let notifications = sqlx::query_as::<_, Notification>(query)
        .bind(user_id)
        .fetch_all(pool)
        .await?;
    Ok(notifications)
}

pub async fn mark_notifications_read(
    pool: &PgPool,
    user_id: Uuid,
    ids: Option<&[Uuid]>,
) -> AppResult<()> {
    if let Some(ids) = ids {
        sqlx::query("UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2)")
            .bind(user_id)
            .bind(ids)
            .execute(pool)
            .await?;
    } else {
        sqlx::query("UPDATE notifications SET read = true WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;
    }
    Ok(())
}

// ─── Collections ───

pub async fn create_collection(
    pool: &PgPool,
    user_id: Uuid,
    title: &str,
    description: Option<&str>,
    is_public: bool,
) -> AppResult<Collection> {
    let c = sqlx::query_as::<_, Collection>(
        "INSERT INTO collections (user_id, title, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(user_id)
    .bind(title)
    .bind(description.unwrap_or(""))
    .bind(is_public)
    .fetch_one(pool)
    .await?;
    Ok(c)
}

pub async fn get_collections(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Collection>> {
    let collections = sqlx::query_as::<_, Collection>(
        "SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(collections)
}

pub async fn get_collection_by_id(pool: &PgPool, id: Uuid) -> AppResult<Option<Collection>> {
    let c = sqlx::query_as::<_, Collection>("SELECT * FROM collections WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(c)
}

pub async fn update_collection(
    pool: &PgPool,
    id: Uuid,
    title: Option<&str>,
    description: Option<&str>,
    is_public: Option<bool>,
) -> AppResult<Collection> {
    let c = sqlx::query_as::<_, Collection>(
        "UPDATE collections SET title = COALESCE($2, title), description = COALESCE($3, description), is_public = COALESCE($4, is_public), updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(title)
    .bind(description)
    .bind(is_public)
    .fetch_one(pool)
    .await?;
    Ok(c)
}

pub async fn delete_collection(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM collections WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_collection_items(
    pool: &PgPool,
    collection_id: Uuid,
) -> AppResult<Vec<CollectionItem>> {
    let items = sqlx::query_as::<_, CollectionItem>(
        "SELECT * FROM collection_items WHERE collection_id = $1 ORDER BY position ASC",
    )
    .bind(collection_id)
    .fetch_all(pool)
    .await?;
    Ok(items)
}

pub async fn add_collection_item(
    pool: &PgPool,
    collection_id: Uuid,
    scan_id: Option<Uuid>,
    url: &str,
    note: Option<&str>,
) -> AppResult<CollectionItem> {
    let max_pos: Option<i32> =
        sqlx::query_scalar("SELECT MAX(position) FROM collection_items WHERE collection_id = $1")
            .bind(collection_id)
            .fetch_one(pool)
            .await?;
    let position = max_pos.unwrap_or(0) + 1;
    let item = sqlx::query_as::<_, CollectionItem>(
        "INSERT INTO collection_items (collection_id, scan_id, url, note, position) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(collection_id)
    .bind(scan_id)
    .bind(url)
    .bind(note.unwrap_or(""))
    .bind(position)
    .fetch_one(pool)
    .await?;
    Ok(item)
}

pub async fn remove_collection_item(
    pool: &PgPool,
    collection_id: Uuid,
    item_id: Uuid,
) -> AppResult<()> {
    sqlx::query("DELETE FROM collection_items WHERE id = $1 AND collection_id = $2")
        .bind(item_id)
        .bind(collection_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Leaderboard & Achievements ───

pub async fn get_or_create_user_stats(pool: &PgPool, user_id: Uuid) -> AppResult<UserStats> {
    let stats = sqlx::query_as::<_, UserStats>(
        "INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = user_stats.user_id RETURNING *",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(stats)
}

pub async fn increment_user_scans(pool: &PgPool, user_id: Uuid) -> AppResult<()> {
    sqlx::query(
        "INSERT INTO user_stats (user_id, total_scans, weekly_scans) VALUES ($1, 1, 1) ON CONFLICT (user_id) DO UPDATE SET total_scans = user_stats.total_scans + 1, weekly_scans = user_stats.weekly_scans + 1",
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_leaderboard(pool: &PgPool, period: &str, limit: i64) -> AppResult<Vec<UserStats>> {
    let stats = match period {
        "weekly" => {
            sqlx::query_as::<_, UserStats>(
                "SELECT * FROM user_stats ORDER BY weekly_scans DESC LIMIT $1",
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        _ => {
            sqlx::query_as::<_, UserStats>(
                "SELECT * FROM user_stats ORDER BY total_scans DESC LIMIT $1",
            )
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };
    Ok(stats)
}

pub async fn get_user_achievements(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Achievement>> {
    let achievements = sqlx::query_as::<_, Achievement>(
        "SELECT * FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(achievements)
}

pub async fn get_all_badges(pool: &PgPool) -> AppResult<Vec<Badge>> {
    let badges = sqlx::query_as::<_, Badge>("SELECT * FROM badges ORDER BY category, id")
        .fetch_all(pool)
        .await?;
    Ok(badges)
}

pub async fn award_achievement(
    pool: &PgPool,
    user_id: Uuid,
    badge_id: &str,
) -> AppResult<Option<Achievement>> {
    let achievement = sqlx::query_as::<_, Achievement>(
        "INSERT INTO achievements (user_id, badge_id) VALUES ($1, $2) ON CONFLICT (user_id, badge_id) DO NOTHING RETURNING *",
    )
    .bind(user_id)
    .bind(badge_id)
    .fetch_optional(pool)
    .await?;
    Ok(achievement)
}

// ─── Domain Verification ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct DomainVerification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_method: String,
    pub verification_token: String,
    pub verified: bool,
    pub verified_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_domain_verification(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    method: &str,
    token: &str,
) -> AppResult<DomainVerification> {
    let dv = sqlx::query_as::<_, DomainVerification>(
        "INSERT INTO domain_verifications (user_id, domain, verification_method, verification_token) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, domain) DO UPDATE SET verification_method = $3, verification_token = $4, verified = false, verified_at = NULL RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(method)
    .bind(token)
    .fetch_one(pool)
    .await?;
    Ok(dv)
}

pub async fn get_domain_verification(
    pool: &PgPool,
    id: Uuid,
) -> AppResult<Option<DomainVerification>> {
    let dv =
        sqlx::query_as::<_, DomainVerification>("SELECT * FROM domain_verifications WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;
    Ok(dv)
}

pub async fn mark_domain_verified(pool: &PgPool, id: Uuid) -> AppResult<DomainVerification> {
    let dv = sqlx::query_as::<_, DomainVerification>(
        "UPDATE domain_verifications SET verified = true, verified_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(dv)
}

pub async fn get_user_domains(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<DomainVerification>> {
    let domains = sqlx::query_as::<_, DomainVerification>(
        "SELECT * FROM domain_verifications WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(domains)
}

pub async fn delete_domain_verification(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM domain_verifications WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_verified_domain(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
) -> AppResult<Option<DomainVerification>> {
    let dv = sqlx::query_as::<_, DomainVerification>(
        "SELECT * FROM domain_verifications WHERE user_id = $1 AND domain = $2 AND verified = true",
    )
    .bind(user_id)
    .bind(domain)
    .fetch_optional(pool)
    .await?;
    Ok(dv)
}

// ─── Deep Scans ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct DeepScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub status: String,
    pub pages_found: i32,
    pub pages_scanned: i32,
    pub max_pages: i32,
    pub results: Option<serde_json::Value>,
    pub paired_audit_id: Option<Uuid>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

/// Lightweight version of DeepScan without the heavy `results` JSONB column.
/// Used for list endpoints and existence checks to avoid loading MBs of scan data.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct DeepScanSummary {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub status: String,
    pub pages_found: i32,
    pub pages_scanned: i32,
    pub max_pages: i32,
    pub paired_audit_id: Option<Uuid>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_deep_scan(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    max_pages: i32,
) -> AppResult<DeepScan> {
    let ds = sqlx::query_as::<_, DeepScan>(
        "INSERT INTO deep_scans (user_id, domain, verification_id, max_pages, started_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(max_pages)
    .fetch_one(pool)
    .await?;
    Ok(ds)
}

pub async fn get_deep_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<DeepScan>> {
    let ds = sqlx::query_as::<_, DeepScan>("SELECT * FROM deep_scans WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(ds)
}

pub async fn get_user_deep_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<DeepScan>> {
    let scans = sqlx::query_as::<_, DeepScan>(
        "SELECT * FROM deep_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

/// List deep scans WITHOUT the heavy `results` column.
/// The results JSONB can be tens of MBs per scan — loading all of them
/// for a list view was causing 72 MB+ responses and 35-71s load times.
pub async fn get_user_deep_scans_summary(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<DeepScanSummary>> {
    let scans = sqlx::query_as::<_, DeepScanSummary>(
        "SELECT id, user_id, domain, verification_id, status, pages_found, pages_scanned, max_pages, paired_audit_id, started_at, completed_at, created_at FROM deep_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

// ─── Attack Surface Audits ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct AttackSurfaceAudit {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub status: String,
    pub scope: serde_json::Value,
    pub rate_limit: String,
    pub findings: serde_json::Value,
    pub logs: serde_json::Value,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub tier1_status: String,
    pub tier2_status: String,
    pub tier3_status: String,
    pub tier4_status: String,
    pub ai_summary: String,
    pub paired_deep_scan_id: Option<Uuid>,
    pub consent_ip: Option<String>,
    pub consent_at: Option<chrono::DateTime<Utc>>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_attack_surface_audit(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    scope: &serde_json::Value,
    rate_limit: &str,
) -> AppResult<AttackSurfaceAudit> {
    let audit = sqlx::query_as::<_, AttackSurfaceAudit>(
        "INSERT INTO attack_surface_audits (user_id, domain, verification_id, scope, rate_limit, consent_at, started_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(scope)
    .bind(rate_limit)
    .fetch_one(pool)
    .await?;
    Ok(audit)
}

pub async fn get_attack_surface_audit(pool: &PgPool, id: Uuid) -> AppResult<Option<AttackSurfaceAudit>> {
    let audit = sqlx::query_as::<_, AttackSurfaceAudit>(
        "SELECT * FROM attack_surface_audits WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(audit)
}

pub async fn get_user_attack_surface_audits(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<AttackSurfaceAudit>> {
    let audits = sqlx::query_as::<_, AttackSurfaceAudit>(
        "SELECT * FROM attack_surface_audits WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(audits)
}

pub async fn update_attack_surface_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" {
        "UPDATE attack_surface_audits SET status = $2, completed_at = NOW() WHERE id = $1"
    } else {
        "UPDATE attack_surface_audits SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_deep_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" {
        "UPDATE deep_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else {
        "UPDATE deep_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Full Audit Pairing ───

pub async fn pair_full_audit(pool: &PgPool, audit_id: Uuid, deep_scan_id: Uuid) -> AppResult<()> {
    // Link both directions
    sqlx::query("UPDATE attack_surface_audits SET paired_deep_scan_id = $2 WHERE id = $1")
        .bind(audit_id)
        .bind(deep_scan_id)
        .execute(pool)
        .await?;
    sqlx::query("UPDATE deep_scans SET paired_audit_id = $2 WHERE id = $1")
        .bind(deep_scan_id)
        .bind(audit_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Monitoring ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct UptimeMonitor {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub check_interval_seconds: i32,
    pub expected_status_code: i32,
    pub alert_email: bool,
    pub alert_slack_webhook: Option<String>,
    pub is_active: bool,
    pub last_checked_at: Option<chrono::DateTime<Utc>>,
    pub last_status: Option<String>,
    pub consecutive_failures: i32,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct UptimeCheck {
    pub id: Uuid,
    pub monitor_id: Uuid,
    pub status_code: Option<i32>,
    pub response_time_ms: Option<i32>,
    pub error: Option<String>,
    pub checked_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct SslMonitor {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub alert_days_before_expiry: i32,
    pub issuer: Option<String>,
    pub valid_from: Option<chrono::DateTime<Utc>>,
    pub valid_to: Option<chrono::DateTime<Utc>>,
    pub protocol: Option<String>,
    pub serial_number: Option<String>,
    pub subject_alt_names: Option<Vec<String>>,
    pub last_checked_at: Option<chrono::DateTime<Utc>>,
    pub is_valid: Option<bool>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct SpeedMeasurement {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub url: String,
    pub lcp_ms: Option<f64>,
    pub fid_ms: Option<f64>,
    pub cls: Option<f64>,
    pub ttfb_ms: Option<f64>,
    pub inp_ms: Option<f64>,
    pub page_weight_bytes: Option<i64>,
    pub request_count: Option<i32>,
    pub dom_content_loaded_ms: Option<f64>,
    pub load_time_ms: Option<f64>,
    pub performance_score: Option<i32>,
    pub measured_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ScheduledReport {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub report_type: String,
    pub include_uptime: bool,
    pub include_ssl: bool,
    pub include_speed: bool,
    pub include_security: bool,
    pub recipients: Vec<String>,
    pub is_active: bool,
    pub last_sent_at: Option<chrono::DateTime<Utc>>,
    pub next_send_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

pub async fn create_uptime_monitor(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    interval: i32,
) -> AppResult<UptimeMonitor> {
    let m = sqlx::query_as::<_, UptimeMonitor>(
        "INSERT INTO uptime_monitors (user_id, domain, verification_id, check_interval_seconds) VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(interval)
    .fetch_one(pool)
    .await?;
    Ok(m)
}

pub async fn get_uptime_monitors(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<UptimeMonitor>> {
    let monitors = sqlx::query_as::<_, UptimeMonitor>(
        "SELECT * FROM uptime_monitors WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(monitors)
}

pub async fn get_uptime_monitor(pool: &PgPool, id: Uuid) -> AppResult<Option<UptimeMonitor>> {
    let m = sqlx::query_as::<_, UptimeMonitor>("SELECT * FROM uptime_monitors WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(m)
}

pub async fn delete_uptime_monitor(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM uptime_monitors WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_uptime_checks(
    pool: &PgPool,
    monitor_id: Uuid,
    limit: i64,
) -> AppResult<Vec<UptimeCheck>> {
    let checks = sqlx::query_as::<_, UptimeCheck>(
        "SELECT * FROM uptime_checks WHERE monitor_id = $1 ORDER BY checked_at DESC LIMIT $2",
    )
    .bind(monitor_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(checks)
}

pub async fn create_ssl_monitor(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    alert_days_before_expiry: i32,
) -> AppResult<SslMonitor> {
    let m = sqlx::query_as::<_, SslMonitor>(
        "INSERT INTO ssl_monitors (user_id, domain, verification_id, alert_days_before_expiry)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, domain)
         DO UPDATE SET
             verification_id = EXCLUDED.verification_id,
             alert_days_before_expiry = EXCLUDED.alert_days_before_expiry,
             updated_at = NOW()
         RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(alert_days_before_expiry)
    .fetch_one(pool)
    .await?;
    Ok(m)
}

pub async fn get_ssl_monitors(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<SslMonitor>> {
    let monitors = sqlx::query_as::<_, SslMonitor>(
        "SELECT * FROM ssl_monitors WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(monitors)
}

pub async fn get_ssl_monitor(pool: &PgPool, id: Uuid) -> AppResult<Option<SslMonitor>> {
    let m = sqlx::query_as::<_, SslMonitor>("SELECT * FROM ssl_monitors WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(m)
}

pub async fn delete_ssl_monitor(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM ssl_monitors WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_ssl_monitor_alert_days(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    alert_days: i32,
) -> AppResult<()> {
    sqlx::query("UPDATE ssl_monitors SET alert_days_before_expiry = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3")
        .bind(alert_days)
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_speed_measurements(
    pool: &PgPool,
    domain: &str,
    limit: i64,
) -> AppResult<Vec<SpeedMeasurement>> {
    let measurements = sqlx::query_as::<_, SpeedMeasurement>(
        "SELECT * FROM speed_measurements WHERE domain = $1 ORDER BY measured_at DESC LIMIT $2",
    )
    .bind(domain)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(measurements)
}

pub async fn get_speed_measurement(pool: &PgPool, id: Uuid) -> AppResult<Option<SpeedMeasurement>> {
    let m = sqlx::query_as::<_, SpeedMeasurement>("SELECT * FROM speed_measurements WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(m)
}

pub async fn delete_speed_measurement(pool: &PgPool, id: Uuid, user_id: Uuid) -> AppResult<()> {
    sqlx::query("DELETE FROM speed_measurements WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_speed_measurements_by_domain(
    pool: &PgPool,
    domain: &str,
    user_id: Uuid,
) -> AppResult<()> {
    sqlx::query("DELETE FROM speed_measurements WHERE domain = $1 AND user_id = $2")
        .bind(domain)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn create_scheduled_report(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    report_type: &str,
    recipients: &[String],
) -> AppResult<ScheduledReport> {
    let r = sqlx::query_as::<_, ScheduledReport>(
        "INSERT INTO scheduled_reports (user_id, domain, verification_id, report_type, recipients) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(report_type)
    .bind(recipients)
    .fetch_one(pool)
    .await?;
    Ok(r)
}

pub async fn get_scheduled_reports(
    pool: &PgPool,
    user_id: Uuid,
) -> AppResult<Vec<ScheduledReport>> {
    let reports = sqlx::query_as::<_, ScheduledReport>(
        "SELECT * FROM scheduled_reports WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(reports)
}

// ─── Scan by Domain ───

pub async fn get_scan_by_domain(pool: &PgPool, domain: &str) -> AppResult<Option<ScanRow>> {
    // Match the domain precisely: url must contain ://{domain}/ or ://{domain} at end
    // Also try www. variant. Prefer homepage scans (shorter URL) and most recent.
    let exact = format!("%://{}%", domain);
    let www = format!("%://www.{}%", domain);
    let scan = sqlx::query_as::<_, ScanRow>(
        "SELECT id, url, url_hash, result, scanned_at, expires_at FROM scans WHERE (url LIKE $1 OR url LIKE $2) ORDER BY length(url) ASC, scanned_at DESC LIMIT 1",
    )
    .bind(&exact)
    .bind(&www)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

// ─── Badge Checking ───

pub async fn check_and_award_badges(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Achievement>> {
    let stats = get_or_create_user_stats(pool, user_id).await?;
    let existing = get_user_achievements(pool, user_id).await?;
    let existing_ids: std::collections::HashSet<&str> =
        existing.iter().map(|a| a.badge_id.as_str()).collect();

    let mut newly_awarded = Vec::new();

    // Simple badge rules based on scan counts
    let badge_rules: Vec<(&str, i32)> = vec![
        ("first_scan", 1),
        ("scanner_10", 10),
        ("scanner_50", 50),
        ("scanner_100", 100),
        ("scanner_500", 500),
    ];

    for (badge_id, threshold) in badge_rules {
        if stats.total_scans >= threshold && !existing_ids.contains(badge_id) {
            if let Some(achievement) = award_achievement(pool, user_id, badge_id).await? {
                newly_awarded.push(achievement);
            }
        }
    }

    Ok(newly_awarded)
}

// ─── Helpers ───

fn generate_slug() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
    (0..10)
        .map(|_| chars[rng.gen_range(0..chars.len())])
        .collect()
}

pub fn generate_verification_token() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
    (0..32)
        .map(|_| chars[rng.gen_range(0..chars.len())])
        .collect()
}

// ─── Lead Intelligence: Domain Profiles & Technology Index ───

use crate::models::lead::{
    AiVisibilityCheck, AiVisibilityResult, DomainProfile, LeadResult, LeadSearchParams,
    TechnologyCount, TechnologyEntry, TrafficHistoryEntry,
};

fn extract_domain(url: &str) -> String {
    let url = url.trim().to_lowercase();
    let without_scheme = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .unwrap_or(&url);
    let host = without_scheme.split('/').next().unwrap_or(without_scheme);
    host.strip_prefix("www.").unwrap_or(host).to_string()
}

pub async fn upsert_domain_profile_from_scan(
    pool: &PgPool,
    url: &str,
    result: &serde_json::Value,
) -> AppResult<()> {
    let domain = extract_domain(url);

    let company = result.get("company");
    let security = result.get("security");
    let seo = result.get("seo");
    let traffic = result.get("traffic");
    let business = result.get("business_signals");
    let email_patterns = result.get("email_patterns");

    let company_name = company
        .and_then(|c| c.get("name"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let description = company
        .and_then(|c| c.get("description"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let industry = company
        .and_then(|c| c.get("industry"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let location = company
        .and_then(|c| c.get("location"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let employees_range = company
        .and_then(|c| c.get("employees_range").or_else(|| c.get("employee_range")))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let founded = company
        .and_then(|c| c.get("founded"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let logo_url = company
        .and_then(|c| c.get("logo").or_else(|| c.get("logo_url")))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let tranco_rank = traffic.and_then(|t| t.get("tranco_rank")).and_then(|v| v.as_i64()).map(|v| v as i32);
    let traffic_tier = traffic
        .and_then(|t| t.get("traffic_tier"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let estimated_monthly_visits = traffic
        .and_then(|t| t.get("estimated_monthly_visits"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let email_pattern = email_patterns
        .and_then(|e| e.get("pattern"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let found_emails: Vec<String> = email_patterns
        .and_then(|e| e.get("found_emails"))
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
        .unwrap_or_default();
    let contact_page_url = email_patterns
        .and_then(|e| e.get("contact_page_url"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let team_page_url = email_patterns
        .and_then(|e| e.get("team_page_url"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let social_links = result
        .get("social_links")
        .cloned()
        .unwrap_or(serde_json::json!([]));

    let security_grade = security
        .and_then(|s| s.get("grade"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let security_score = security.and_then(|s| s.get("score")).and_then(|v| v.as_i64()).map(|v| v as i32);
    let seo_score = seo.and_then(|s| s.get("score")).and_then(|v| v.as_i64()).map(|v| v as i32);

    // Extract business signals (now an object in the JSON)
    let has_pricing = business
        .and_then(|b| b.get("has_pricing"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let has_careers = business
        .and_then(|b| b.get("has_careers"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    sqlx::query(
        "INSERT INTO domain_profiles (domain, url, company_name, description, industry, location, employees_range, founded, logo_url,
         tranco_rank, traffic_tier, estimated_monthly_visits, email_pattern, found_emails, contact_page_url, team_page_url,
         social_links, security_grade, security_score, seo_score, has_pricing, has_careers, last_scanned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
         ON CONFLICT (domain) DO UPDATE SET
         url = COALESCE(EXCLUDED.url, domain_profiles.url),
         company_name = COALESCE(EXCLUDED.company_name, domain_profiles.company_name),
         description = COALESCE(EXCLUDED.description, domain_profiles.description),
         industry = COALESCE(EXCLUDED.industry, domain_profiles.industry),
         location = COALESCE(EXCLUDED.location, domain_profiles.location),
         employees_range = COALESCE(EXCLUDED.employees_range, domain_profiles.employees_range),
         founded = COALESCE(EXCLUDED.founded, domain_profiles.founded),
         logo_url = COALESCE(EXCLUDED.logo_url, domain_profiles.logo_url),
         tranco_rank = COALESCE(EXCLUDED.tranco_rank, domain_profiles.tranco_rank),
         traffic_tier = COALESCE(EXCLUDED.traffic_tier, domain_profiles.traffic_tier),
         estimated_monthly_visits = COALESCE(EXCLUDED.estimated_monthly_visits, domain_profiles.estimated_monthly_visits),
         email_pattern = COALESCE(EXCLUDED.email_pattern, domain_profiles.email_pattern),
         found_emails = CASE WHEN array_length(EXCLUDED.found_emails, 1) > 0 THEN EXCLUDED.found_emails ELSE domain_profiles.found_emails END,
         contact_page_url = COALESCE(EXCLUDED.contact_page_url, domain_profiles.contact_page_url),
         team_page_url = COALESCE(EXCLUDED.team_page_url, domain_profiles.team_page_url),
         social_links = EXCLUDED.social_links,
         security_grade = COALESCE(EXCLUDED.security_grade, domain_profiles.security_grade),
         security_score = COALESCE(EXCLUDED.security_score, domain_profiles.security_score),
         seo_score = COALESCE(EXCLUDED.seo_score, domain_profiles.seo_score),
         has_pricing = EXCLUDED.has_pricing,
         has_careers = EXCLUDED.has_careers,
         last_scanned = NOW()",
    )
    .bind(&domain)
    .bind(url)
    .bind(&company_name)
    .bind(&description)
    .bind(&industry)
    .bind(&location)
    .bind(&employees_range)
    .bind(&founded)
    .bind(&logo_url)
    .bind(tranco_rank)
    .bind(&traffic_tier)
    .bind(&estimated_monthly_visits)
    .bind(&email_pattern)
    .bind(&found_emails)
    .bind(&contact_page_url)
    .bind(&team_page_url)
    .bind(&social_links)
    .bind(&security_grade)
    .bind(security_score)
    .bind(seo_score)
    .bind(has_pricing)
    .bind(has_careers)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn upsert_technology_index_from_scan(
    pool: &PgPool,
    url: &str,
    result: &serde_json::Value,
) -> AppResult<()> {
    let domain = extract_domain(url);

    let tech_stack = match result.get("tech_stack").and_then(|v| v.as_array()) {
        Some(arr) => arr,
        None => return Ok(()),
    };

    for tech in tech_stack {
        let name = match tech.get("name").and_then(|v| v.as_str()) {
            Some(n) => n,
            None => continue,
        };
        let category = tech.get("category").and_then(|v| v.as_str());
        let version = tech.get("version").and_then(|v| v.as_str());
        let confidence = tech.get("confidence").and_then(|v| v.as_f64()).map(|v| v as f32);

        sqlx::query(
            "INSERT INTO technology_index (domain, technology_name, category, version, confidence, last_seen)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (domain, technology_name) DO UPDATE SET
             category = COALESCE(EXCLUDED.category, technology_index.category),
             version = COALESCE(EXCLUDED.version, technology_index.version),
             confidence = COALESCE(EXCLUDED.confidence, technology_index.confidence),
             last_seen = NOW()",
        )
        .bind(&domain)
        .bind(name)
        .bind(category)
        .bind(version)
        .bind(confidence)
        .execute(pool)
        .await?;
    }

    Ok(())
}

// ─── Lead Search ───

pub async fn search_leads(
    pool: &PgPool,
    params: &LeadSearchParams,
    page: i64,
    per_page: i64,
) -> AppResult<(Vec<LeadResult>, i64)> {
    let offset = (page - 1) * per_page;

    // Build dynamic WHERE clauses
    let mut conditions = Vec::new();
    let mut bind_idx = 1u32;

    // Technology filter: join with technology_index
    let has_tech_filter = params.technology.is_some();

    if params.q.is_some() {
        conditions.push(format!(
            "to_tsvector('english', COALESCE(dp.company_name, '') || ' ' || COALESCE(dp.description, '') || ' ' || COALESCE(dp.domain, '')) @@ plainto_tsquery('english', ${bind_idx})"
        ));
        bind_idx += 1;
    }
    if params.industry.is_some() {
        conditions.push(format!("dp.industry = ${bind_idx}"));
        bind_idx += 1;
    }
    if params.employees.is_some() {
        conditions.push(format!("dp.employees_range = ${bind_idx}"));
        bind_idx += 1;
    }
    if params.traffic_tier.is_some() {
        conditions.push(format!("dp.traffic_tier = ${bind_idx}"));
        bind_idx += 1;
    }
    if params.location.is_some() {
        conditions.push(format!("dp.location ILIKE '%' || ${bind_idx} || '%'"));
        bind_idx += 1;
    }
    if has_tech_filter {
        conditions.push(format!(
            "EXISTS (SELECT 1 FROM technology_index ti WHERE ti.domain = dp.domain AND ti.technology_name ILIKE '%' || ${bind_idx} || '%')"
        ));
        bind_idx += 1;
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    // Count query
    let count_sql = format!(
        "SELECT COUNT(*)::bigint AS count FROM domain_profiles dp {where_clause}"
    );

    // Data query
    let data_sql = format!(
        "SELECT dp.domain, dp.url, dp.company_name, dp.industry, dp.employees_range, dp.location,
         dp.traffic_tier, dp.tranco_rank, dp.security_grade, dp.security_score, dp.seo_score, dp.last_scanned
         FROM domain_profiles dp
         {where_clause}
         ORDER BY dp.last_scanned DESC NULLS LAST
         LIMIT ${bind_idx} OFFSET ${}",
        bind_idx + 1
    );

    // We need to bind params dynamically. Since sqlx doesn't support truly dynamic queries easily,
    // we'll use query_scalar and query_as with the raw SQL.
    // For simplicity, use serde_json approach with sqlx::query
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    let mut data_query = sqlx::query_as::<_, LeadResult>(&data_sql);

    // Bind parameters in order
    if let Some(ref q) = params.q {
        count_query = count_query.bind(q);
        data_query = data_query.bind(q);
    }
    if let Some(ref industry) = params.industry {
        count_query = count_query.bind(industry);
        data_query = data_query.bind(industry);
    }
    if let Some(ref employees) = params.employees {
        count_query = count_query.bind(employees);
        data_query = data_query.bind(employees);
    }
    if let Some(ref traffic_tier) = params.traffic_tier {
        count_query = count_query.bind(traffic_tier);
        data_query = data_query.bind(traffic_tier);
    }
    if let Some(ref location) = params.location {
        count_query = count_query.bind(location);
        data_query = data_query.bind(location);
    }
    if let Some(ref technology) = params.technology {
        count_query = count_query.bind(technology);
        data_query = data_query.bind(technology);
    }

    data_query = data_query.bind(per_page).bind(offset);

    let total = count_query.fetch_one(pool).await?;
    let results = data_query.fetch_all(pool).await?;

    Ok((results, total))
}

pub async fn list_indexed_technologies(pool: &PgPool) -> AppResult<Vec<TechnologyCount>> {
    let techs = sqlx::query_as::<_, TechnologyCount>(
        "SELECT technology_name, category, COUNT(DISTINCT domain)::bigint AS domain_count
         FROM technology_index
         GROUP BY technology_name, category
         ORDER BY domain_count DESC
         LIMIT 500",
    )
    .fetch_all(pool)
    .await?;
    Ok(techs)
}

pub async fn get_domain_profile(
    pool: &PgPool,
    domain: &str,
) -> AppResult<Option<DomainProfile>> {
    let profile = sqlx::query_as::<_, DomainProfile>(
        "SELECT * FROM domain_profiles WHERE domain = $1",
    )
    .bind(domain)
    .fetch_optional(pool)
    .await?;
    Ok(profile)
}

pub async fn get_domain_technologies(
    pool: &PgPool,
    domain: &str,
) -> AppResult<Vec<TechnologyEntry>> {
    let techs = sqlx::query_as::<_, TechnologyEntry>(
        "SELECT technology_name, category, version, confidence
         FROM technology_index WHERE domain = $1
         ORDER BY confidence DESC NULLS LAST",
    )
    .bind(domain)
    .fetch_all(pool)
    .await?;
    Ok(techs)
}

// ─── Traffic History ───

pub async fn get_traffic_history(
    pool: &PgPool,
    domain: &str,
    days: i32,
) -> AppResult<Vec<TrafficHistoryEntry>> {
    let history = sqlx::query_as::<_, TrafficHistoryEntry>(
        "SELECT domain, tranco_rank, traffic_tier, estimated_monthly_visits, composite_score,
         crux_lcp_ms, crux_fid_ms, crux_cls, data_sources, recorded_at
         FROM traffic_history
         WHERE domain = $1 AND recorded_at >= NOW() - make_interval(days => $2)
         ORDER BY recorded_at DESC",
    )
    .bind(domain)
    .bind(days)
    .fetch_all(pool)
    .await?;
    Ok(history)
}

// ─── AI Visibility ───

pub async fn count_user_ai_visibility_this_month(
    pool: &PgPool,
    user_id: Uuid,
) -> AppResult<i64> {
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM ai_visibility_checks WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(count.0)
}

pub async fn get_recent_ai_visibility_check(
    pool: &PgPool,
    domain: &str,
    user_id: Uuid,
) -> AppResult<Option<AiVisibilityCheck>> {
    let check = sqlx::query_as::<_, AiVisibilityCheck>(
        "SELECT * FROM ai_visibility_checks WHERE domain = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(domain)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(check)
}

pub async fn create_ai_visibility_check(
    pool: &PgPool,
    domain: &str,
    user_id: Uuid,
    brand_name: &str,
    industry: Option<&str>,
) -> AppResult<AiVisibilityCheck> {
    let check = sqlx::query_as::<_, AiVisibilityCheck>(
        "INSERT INTO ai_visibility_checks (domain, user_id, brand_name, industry)
         VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(domain)
    .bind(user_id)
    .bind(brand_name)
    .bind(industry)
    .fetch_one(pool)
    .await?;
    Ok(check)
}

pub async fn list_ai_visibility_checks(
    pool: &PgPool,
    user_id: Uuid,
) -> AppResult<Vec<AiVisibilityCheck>> {
    let checks = sqlx::query_as::<_, AiVisibilityCheck>(
        "SELECT * FROM ai_visibility_checks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(checks)
}

pub async fn get_ai_visibility_check(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> AppResult<Option<AiVisibilityCheck>> {
    let check = sqlx::query_as::<_, AiVisibilityCheck>(
        "SELECT * FROM ai_visibility_checks WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(check)
}

pub async fn get_ai_visibility_results(
    pool: &PgPool,
    check_id: Uuid,
) -> AppResult<Vec<AiVisibilityResult>> {
    let results = sqlx::query_as::<_, AiVisibilityResult>(
        "SELECT * FROM ai_visibility_results WHERE check_id = $1 ORDER BY checked_at ASC",
    )
    .bind(check_id)
    .fetch_all(pool)
    .await?;
    Ok(results)
}

// ─── GEO: Citations ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct AiVisibilityCitation {
    pub id: Uuid,
    pub check_id: Uuid,
    pub result_id: Option<Uuid>,
    pub source_url: String,
    pub source_type: String,
    pub source_title: Option<String>,
    pub platform: Option<String>,
    pub is_gap_source: Option<bool>,
    pub competitor_name: Option<String>,
    pub discovered_at: Option<chrono::DateTime<Utc>>,
}

pub async fn get_ai_visibility_citations(
    pool: &PgPool,
    check_id: Uuid,
) -> AppResult<Vec<AiVisibilityCitation>> {
    let citations = sqlx::query_as::<_, AiVisibilityCitation>(
        "SELECT * FROM ai_visibility_citations WHERE check_id = $1 ORDER BY discovered_at ASC",
    )
    .bind(check_id)
    .fetch_all(pool)
    .await?;
    Ok(citations)
}

// ─── GEO: Share of Voice ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ShareOfVoice {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub brand_name: String,
    pub category: String,
    pub total_queries: Option<i32>,
    pub brand_mentioned_count: Option<i32>,
    pub share_percentage: Option<f64>,
    pub top_competitors: Option<serde_json::Value>,
    pub period_start: chrono::NaiveDate,
    pub period_end: chrono::NaiveDate,
    pub created_at: Option<chrono::DateTime<Utc>>,
}

pub async fn get_share_of_voice(
    pool: &PgPool,
    domain: &str,
    user_id: Uuid,
) -> AppResult<Vec<ShareOfVoice>> {
    let sov = sqlx::query_as::<_, ShareOfVoice>(
        "SELECT id, user_id, domain, brand_name, category, total_queries, brand_mentioned_count, share_percentage::float8, top_competitors, period_start, period_end, created_at FROM ai_share_of_voice WHERE domain = $1 AND user_id = $2 ORDER BY period_start DESC LIMIT 12",
    )
    .bind(domain)
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(sov)
}

// ─── GEO: Brand Mentions ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct BrandMention {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub brand_name: String,
    pub source: String,
    pub source_url: String,
    pub title: Option<String>,
    pub body_snippet: Option<String>,
    pub author: Option<String>,
    pub subreddit: Option<String>,
    pub score: Option<i32>,
    pub comment_count: Option<i32>,
    pub sentiment: Option<String>,
    pub is_google_ranking: Option<bool>,
    pub discovered_at: Option<chrono::DateTime<Utc>>,
}

pub async fn list_brand_mentions(
    pool: &PgPool,
    user_id: Uuid,
    source: Option<&str>,
    sentiment: Option<&str>,
    limit: i64,
) -> AppResult<Vec<BrandMention>> {
    let mentions = sqlx::query_as::<_, BrandMention>(
        "SELECT * FROM brand_mentions WHERE user_id = $1 AND ($2::text IS NULL OR source = $2) AND ($3::text IS NULL OR sentiment = $3) ORDER BY discovered_at DESC LIMIT $4",
    )
    .bind(user_id)
    .bind(source)
    .bind(sentiment)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(mentions)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MentionSummary {
    pub total: i64,
    pub by_source: serde_json::Value,
    pub by_sentiment: serde_json::Value,
    pub recent_count_7d: i64,
}

pub async fn get_mention_summary(
    pool: &PgPool,
    user_id: Uuid,
) -> AppResult<MentionSummary> {
    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM brand_mentions WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let by_source: Vec<(String, i64)> = sqlx::query_as(
        "SELECT source, COUNT(*)::bigint FROM brand_mentions WHERE user_id = $1 GROUP BY source",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let by_sentiment: Vec<(String, i64)> = sqlx::query_as(
        "SELECT COALESCE(sentiment, 'neutral'), COUNT(*)::bigint FROM brand_mentions WHERE user_id = $1 GROUP BY sentiment",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let recent: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM brand_mentions WHERE user_id = $1 AND discovered_at >= NOW() - INTERVAL '7 days'",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let source_map: serde_json::Map<String, serde_json::Value> = by_source
        .into_iter()
        .map(|(k, v)| (k, serde_json::Value::Number(v.into())))
        .collect();

    let sentiment_map: serde_json::Map<String, serde_json::Value> = by_sentiment
        .into_iter()
        .map(|(k, v)| (k, serde_json::Value::Number(v.into())))
        .collect();

    Ok(MentionSummary {
        total: total.0,
        by_source: serde_json::Value::Object(source_map),
        by_sentiment: serde_json::Value::Object(sentiment_map),
        recent_count_7d: recent.0,
    })
}

// ─── GEO: Thread Opportunities ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ThreadOpportunity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub brand_name: String,
    pub platform: String,
    pub thread_url: String,
    pub title: Option<String>,
    pub subreddit: Option<String>,
    pub thread_type: Option<String>,
    pub score: Option<i32>,
    pub comment_count: Option<i32>,
    pub age_days: Option<i32>,
    pub is_google_ranking: Option<bool>,
    pub opportunity_score: Option<i32>,
    pub suggested_angle: Option<String>,
    pub status: Option<String>,
    pub discovered_at: Option<chrono::DateTime<Utc>>,
}

pub async fn list_thread_opportunities(
    pool: &PgPool,
    user_id: Uuid,
    platform: Option<&str>,
    status: Option<&str>,
    thread_type: Option<&str>,
    limit: i64,
) -> AppResult<Vec<ThreadOpportunity>> {
    let threads = sqlx::query_as::<_, ThreadOpportunity>(
        "SELECT * FROM thread_opportunities WHERE user_id = $1 AND ($2::text IS NULL OR platform = $2) AND ($3::text IS NULL OR status = $3) AND ($4::text IS NULL OR thread_type = $4) ORDER BY opportunity_score DESC LIMIT $5",
    )
    .bind(user_id)
    .bind(platform)
    .bind(status)
    .bind(thread_type)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(threads)
}

pub async fn get_thread_opportunity(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> AppResult<Option<ThreadOpportunity>> {
    let thread = sqlx::query_as::<_, ThreadOpportunity>(
        "SELECT * FROM thread_opportunities WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(thread)
}

pub async fn update_thread_status(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    status: &str,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE thread_opportunities SET status = $3 WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .bind(status)
    .execute(pool)
    .await?;
    Ok(())
}

// ─── Offensive Scans ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct OffensiveScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub domain_verification_id: Option<Uuid>,
    pub scope: serde_json::Value,
    pub rate_limit: String,
    pub status: String,
    pub findings: serde_json::Value,
    pub logs: serde_json::Value,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub tools_used: Vec<String>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_offensive_scan(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    scope: &serde_json::Value,
    rate_limit: &str,
) -> AppResult<OffensiveScan> {
    let scan = sqlx::query_as::<_, OffensiveScan>(
        "INSERT INTO offensive_scans (user_id, domain, domain_verification_id, scope, rate_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(scope)
    .bind(rate_limit)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_offensive_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<OffensiveScan>> {
    let scan = sqlx::query_as::<_, OffensiveScan>(
        "SELECT * FROM offensive_scans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_user_offensive_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<OffensiveScan>> {
    let scans = sqlx::query_as::<_, OffensiveScan>(
        "SELECT * FROM offensive_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn count_user_offensive_scans_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM offensive_scans WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_offensive_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" || status == "cancelled" || status == "killed" || status == "blocked_risk" {
        "UPDATE offensive_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else if status == "running" {
        "UPDATE offensive_scans SET status = $2, started_at = NOW() WHERE id = $1"
    } else {
        // classifying, awaiting_confirmation, pending
        "UPDATE offensive_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Scope Contracts ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ScopeContract {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub domain_verification_id: Option<Uuid>,
    pub scope_mode: String,
    pub included_targets: Vec<String>,
    pub excluded_targets: Vec<String>,
    pub ip_ranges: Vec<String>,
    pub include_third_party: bool,
    pub signed_at: chrono::DateTime<Utc>,
    pub signer_ip: String,
    pub signer_user_agent: String,
    pub legal_version: String,
    pub expires_at: chrono::DateTime<Utc>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_scope_contract(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    scope_mode: &str,
    excluded_targets: &[String],
    include_third_party: bool,
    signer_ip: &str,
    signer_user_agent: &str,
) -> AppResult<ScopeContract> {
    let contract = sqlx::query_as::<_, ScopeContract>(
        "INSERT INTO scope_contracts (user_id, domain, domain_verification_id, scope_mode, excluded_targets, include_third_party, signer_ip, signer_user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(scope_mode)
    .bind(excluded_targets)
    .bind(include_third_party)
    .bind(signer_ip)
    .bind(signer_user_agent)
    .fetch_one(pool)
    .await?;
    Ok(contract)
}

pub async fn get_scope_contract(pool: &PgPool, id: Uuid) -> AppResult<Option<ScopeContract>> {
    let contract = sqlx::query_as::<_, ScopeContract>(
        "SELECT * FROM scope_contracts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(contract)
}

pub async fn get_active_scope_contracts(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<ScopeContract>> {
    let contracts = sqlx::query_as::<_, ScopeContract>(
        "SELECT * FROM scope_contracts WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(contracts)
}

pub async fn link_scope_contract_to_scan(pool: &PgPool, scan_id: Uuid, contract_id: Uuid) -> AppResult<()> {
    sqlx::query("UPDATE offensive_scans SET scope_contract_id = $2 WHERE id = $1")
        .bind(scan_id)
        .bind(contract_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Offensive Audit Log ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct OffensiveAuditEvent {
    pub id: Uuid,
    pub scan_id: Uuid,
    pub event_type: String,
    pub event_data: serde_json::Value,
    pub target_host: Option<String>,
    pub target_ip: Option<String>,
    pub decision: String,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn get_audit_log_for_scan(pool: &PgPool, scan_id: Uuid) -> AppResult<Vec<OffensiveAuditEvent>> {
    let events = sqlx::query_as::<_, OffensiveAuditEvent>(
        "SELECT * FROM offensive_audit_log WHERE scan_id = $1 ORDER BY created_at ASC",
    )
    .bind(scan_id)
    .fetch_all(pool)
    .await?;
    Ok(events)
}

// ─── Mobile Scans ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct MobileScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub app_name: Option<String>,
    pub package_name: Option<String>,
    pub platform: String,
    pub scan_mode: String,
    pub file_name: String,
    pub file_size_bytes: i64,
    pub file_hash_sha256: String,
    pub scope: serde_json::Value,
    pub status: String,
    pub findings: serde_json::Value,
    pub logs: serde_json::Value,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub tools_used: Vec<String>,
    pub app_metadata: Option<serde_json::Value>,
    pub api_endpoints_found: Vec<String>,
    pub framework_detected: Option<String>,
    pub offensive_scan_id: Option<Uuid>,
    pub verdict: Option<serde_json::Value>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_mobile_scan(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    file_name: &str,
    file_size_bytes: i64,
    file_hash_sha256: &str,
    platform: &str,
    scan_mode: &str,
    scope: &serde_json::Value,
) -> AppResult<MobileScan> {
    let scan = sqlx::query_as::<_, MobileScan>(
        "INSERT INTO mobile_scans (id, user_id, file_name, file_size_bytes, file_hash_sha256, platform, scan_mode, scope) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    )
    .bind(id)
    .bind(user_id)
    .bind(file_name)
    .bind(file_size_bytes)
    .bind(file_hash_sha256)
    .bind(platform)
    .bind(scan_mode)
    .bind(scope)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_mobile_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<MobileScan>> {
    let scan = sqlx::query_as::<_, MobileScan>(
        "SELECT * FROM mobile_scans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_user_mobile_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<MobileScan>> {
    let scans = sqlx::query_as::<_, MobileScan>(
        "SELECT * FROM mobile_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn count_user_mobile_scans_today(pool: &PgPool, user_id: Uuid, scan_mode: &str) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM mobile_scans WHERE user_id = $1 AND scan_mode = $2 AND created_at >= date_trunc('day', NOW())",
    )
    .bind(user_id)
    .bind(scan_mode)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn count_user_mobile_audits_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM mobile_scans WHERE user_id = $1 AND scan_mode IN ('security_audit', 'offensive_pentest') AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_mobile_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" || status == "cancelled" {
        "UPDATE mobile_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else if status == "running" {
        "UPDATE mobile_scans SET status = $2, started_at = NOW() WHERE id = $1"
    } else {
        "UPDATE mobile_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Extension Scans ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ExtensionScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub extension_name: Option<String>,
    pub extension_id: Option<String>,
    pub manifest_version: Option<i32>,
    pub file_name: String,
    pub file_size_bytes: i64,
    pub file_hash_sha256: String,
    pub scope: serde_json::Value,
    pub status: String,
    pub findings: serde_json::Value,
    pub logs: serde_json::Value,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub tools_used: Vec<String>,
    pub permissions_declared: Vec<String>,
    pub host_permissions: Vec<String>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_extension_scan(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    file_name: &str,
    file_size_bytes: i64,
    file_hash_sha256: &str,
) -> AppResult<ExtensionScan> {
    let scan = sqlx::query_as::<_, ExtensionScan>(
        "INSERT INTO extension_scans (id, user_id, file_name, file_size_bytes, file_hash_sha256) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(id)
    .bind(user_id)
    .bind(file_name)
    .bind(file_size_bytes)
    .bind(file_hash_sha256)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_extension_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<ExtensionScan>> {
    let scan = sqlx::query_as::<_, ExtensionScan>(
        "SELECT * FROM extension_scans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_user_extension_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<ExtensionScan>> {
    let scans = sqlx::query_as::<_, ExtensionScan>(
        "SELECT * FROM extension_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn count_user_extension_scans_today(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM extension_scans WHERE user_id = $1 AND created_at >= date_trunc('day', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_extension_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" || status == "cancelled" {
        "UPDATE extension_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else if status == "running" {
        "UPDATE extension_scans SET status = $2, started_at = NOW() WHERE id = $1"
    } else {
        "UPDATE extension_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── API Spec Scans ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct ApiSpecScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub domain_verification_id: Option<Uuid>,
    pub spec_format: String,
    pub endpoints_found: i32,
    pub scope: serde_json::Value,
    pub rate_limit: String,
    pub status: String,
    pub findings: serde_json::Value,
    pub logs: serde_json::Value,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub tools_used: Vec<String>,
    pub spec_issues: serde_json::Value,
    // Backward-compatible rollout: older DBs won't have these columns yet.
    // `#[sqlx(default)]` avoids runtime 500s by defaulting missing fields.
    #[sqlx(default)]
    pub endpoint_inventory: Option<serde_json::Value>,
    #[sqlx(default)]
    pub coverage_summary: Option<serde_json::Value>,
    pub offensive_scan_id: Option<Uuid>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_api_spec_scan(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    spec_format: &str,
    scope: &serde_json::Value,
    rate_limit: &str,
) -> AppResult<ApiSpecScan> {
    let scan = sqlx::query_as::<_, ApiSpecScan>(
        "INSERT INTO api_spec_scans (user_id, domain, domain_verification_id, spec_format, scope, rate_limit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(spec_format)
    .bind(scope)
    .bind(rate_limit)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_api_spec_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<ApiSpecScan>> {
    let scan = sqlx::query_as::<_, ApiSpecScan>(
        "SELECT * FROM api_spec_scans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_user_api_spec_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<ApiSpecScan>> {
    let scans = sqlx::query_as::<_, ApiSpecScan>(
        "SELECT * FROM api_spec_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn count_user_api_spec_scans_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM api_spec_scans WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_api_spec_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" || status == "cancelled" {
        "UPDATE api_spec_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else if status == "running" {
        "UPDATE api_spec_scans SET status = $2, started_at = NOW() WHERE id = $1"
    } else {
        "UPDATE api_spec_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Domain Scans (Unified Orchestrator) ───

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct DomainScan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub domain: String,
    pub verification_id: Uuid,
    pub mode: String,
    pub status: String,
    pub deep_scan_id: Option<Uuid>,
    pub attack_surface_id: Option<Uuid>,
    pub offensive_scan_id: Option<Uuid>,
    pub api_spec_scan_id: Option<Uuid>,
    pub scope_contract_id: Option<Uuid>,
    pub total_findings: i32,
    pub severity_critical: i32,
    pub severity_high: i32,
    pub severity_medium: i32,
    pub severity_low: i32,
    pub severity_info: i32,
    pub scope: serde_json::Value,
    pub rate_limit: String,
    pub spec_content: Option<String>,
    pub started_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn create_domain_scan(
    pool: &PgPool,
    user_id: Uuid,
    domain: &str,
    verification_id: Uuid,
    mode: &str,
    scope: &serde_json::Value,
    rate_limit: &str,
    spec_content: Option<&str>,
) -> AppResult<DomainScan> {
    let scan = sqlx::query_as::<_, DomainScan>(
        "INSERT INTO domain_scans (user_id, domain, verification_id, mode, scope, rate_limit, spec_content, started_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
    )
    .bind(user_id)
    .bind(domain)
    .bind(verification_id)
    .bind(mode)
    .bind(scope)
    .bind(rate_limit)
    .bind(spec_content)
    .fetch_one(pool)
    .await?;
    Ok(scan)
}

pub async fn get_domain_scan(pool: &PgPool, id: Uuid) -> AppResult<Option<DomainScan>> {
    let scan = sqlx::query_as::<_, DomainScan>(
        "SELECT * FROM domain_scans WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(scan)
}

pub async fn get_user_domain_scans(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<DomainScan>> {
    let scans = sqlx::query_as::<_, DomainScan>(
        "SELECT * FROM domain_scans WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(scans)
}

pub async fn count_user_domain_scans_this_month(pool: &PgPool, user_id: Uuid) -> AppResult<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM domain_scans WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_domain_scan_child_ids(
    pool: &PgPool,
    id: Uuid,
    deep_scan_id: Option<Uuid>,
    attack_surface_id: Option<Uuid>,
    offensive_scan_id: Option<Uuid>,
    api_spec_scan_id: Option<Uuid>,
    scope_contract_id: Option<Uuid>,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE domain_scans SET deep_scan_id = $2, attack_surface_id = $3, offensive_scan_id = $4, api_spec_scan_id = $5, scope_contract_id = $6 WHERE id = $1",
    )
    .bind(id)
    .bind(deep_scan_id)
    .bind(attack_surface_id)
    .bind(offensive_scan_id)
    .bind(api_spec_scan_id)
    .bind(scope_contract_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_domain_scan_status(pool: &PgPool, id: Uuid, status: &str) -> AppResult<()> {
    let query = if status == "complete" || status == "failed" || status == "cancelled" {
        "UPDATE domain_scans SET status = $2, completed_at = NOW() WHERE id = $1"
    } else if status == "running" {
        "UPDATE domain_scans SET status = $2, started_at = NOW() WHERE id = $1"
    } else {
        "UPDATE domain_scans SET status = $2 WHERE id = $1"
    };
    sqlx::query(query)
        .bind(id)
        .bind(status)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_domain_scan_findings(
    pool: &PgPool,
    id: Uuid,
    total: i32,
    critical: i32,
    high: i32,
    medium: i32,
    low: i32,
    info: i32,
) -> AppResult<()> {
    sqlx::query(
        "UPDATE domain_scans SET total_findings = $2, severity_critical = $3, severity_high = $4, severity_medium = $5, severity_low = $6, severity_info = $7 WHERE id = $1",
    )
    .bind(id)
    .bind(total)
    .bind(critical)
    .bind(high)
    .bind(medium)
    .bind(low)
    .bind(info)
    .execute(pool)
    .await?;
    Ok(())
}
