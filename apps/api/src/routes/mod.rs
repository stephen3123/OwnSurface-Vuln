pub mod ai_visibility;
pub mod mentions;
pub mod threads;
pub mod api_spec;
pub mod attack_surface;
pub mod domain_scan;
pub mod extension;
pub mod mobile;
pub mod offensive;
pub mod auth;
pub mod billing;
pub mod bulk;
pub mod collections;
pub mod deep_scan;
pub mod domains;
pub mod enrichment;
pub mod follows;
pub mod health;
pub mod history;
pub mod leads;
pub mod leaderboard;
pub mod monitoring;
pub mod profiles;
pub mod radar;
pub mod reports;
pub mod scan;
pub mod showcase;
pub mod watchlist;
pub mod webhooks;

use axum::{
    extract::DefaultBodyLimit,
    middleware,
    routing::{delete, get, post, put},
    Router,
};

use crate::middleware::auth::auth_middleware;
use crate::middleware::rate_limit::rate_limit_middleware;
use crate::state::AppState;

pub fn create_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/", get(health::api_root))
        .route("/health", get(health::health_check))
        .route("/metrics", get(health::prometheus_metrics))
        .route("/api/v1/auth/register", post(auth::register))
        .route(
            "/api/v1/auth/register/verify",
            post(auth::verify_registration),
        )
        .route(
            "/api/v1/auth/register/resend",
            post(auth::resend_registration_otp),
        )
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/logout", post(auth::logout))
        .route(
            "/api/v1/auth/password/request-reset",
            post(auth::request_password_reset),
        )
        .route(
            "/api/v1/auth/password/confirm-reset",
            post(auth::confirm_password_reset),
        )
        .route(
            "/api/v1/reports/public/{slug}",
            get(reports::get_public_report),
        )
        .route("/api/v1/billing/webhook", post(billing::stripe_webhook))
        .route("/api/v1/mcp", get(health::mcp_manifest))
        // Public profiles
        .route(
            "/api/v1/profile/{username}",
            get(profiles::get_public_profile),
        )
        // Security badge SVG
        .route(
            "/api/v1/badge/{domain}",
            get(monitoring::get_security_badge),
        )
        // Showcase scans for landing page (no auth)
        .route("/api/v1/showcase", get(showcase::get_showcase))
        // All showcase domains for sitemap (no auth, lightweight)
        .route("/api/v1/showcase/domains", get(showcase::get_showcase_domains))
        // Public scan page data (no auth, for SEO /site/{domain} pages)
        .route("/api/v1/scan/site/{domain}", get(scan::get_public_scan))
        .route("/api/v1/webhooks/trigger", post(webhooks::trigger_webhook));

    let protected_routes = Router::new()
        .route("/api/v1/auth/me", get(auth::me))
        .route("/api/v1/auth/session", get(auth::session))
        .route(
            "/api/v1/auth/password/change",
            post(auth::change_password),
        )
        .route(
            "/api/v1/auth/settings/profile",
            put(auth::update_settings_profile),
        )
        .route(
            "/api/v1/auth/settings/notifications",
            get(auth::get_notification_prefs),
        )
        .route(
            "/api/v1/auth/settings/notifications",
            put(auth::update_notification_prefs),
        )
        .route(
            "/api/v1/auth/account",
            delete(auth::delete_account),
        )
        .route("/api/v1/auth/api-key", post(auth::create_api_key))
        .route("/api/v1/auth/api-keys", get(auth::list_api_keys))
        .route("/api/v1/auth/api-keys/{id}", delete(auth::revoke_api_key))
        // Scan
        .route("/api/v1/scan", post(scan::create_scan))
        .route("/api/v1/scan/recent", get(scan::get_recent_scans))
        .route("/api/v1/scan/{hash}", get(scan::get_scan))
        // Watchlists
        .route("/api/v1/watchlists", post(watchlist::create_watchlist))
        .route("/api/v1/watchlists", get(watchlist::list_watchlists))
        .route("/api/v1/watchlists/{id}", get(watchlist::get_watchlist))
        .route("/api/v1/watchlists/{id}", put(watchlist::update_watchlist))
        .route(
            "/api/v1/watchlists/{id}",
            delete(watchlist::delete_watchlist),
        )
        // Reports
        .route("/api/v1/reports", post(reports::create_report))
        .route("/api/v1/reports", get(reports::list_reports))
        .route("/api/v1/reports/{id}", get(reports::get_report))
        .route("/api/v1/reports/{id}/pdf", post(reports::export_pdf))
        // Collections
        .route("/api/v1/collections", post(collections::create_collection))
        .route("/api/v1/collections", get(collections::list_collections))
        .route("/api/v1/collections/{id}", get(collections::get_collection))
        .route("/api/v1/collections/{id}", put(collections::update_collection))
        .route("/api/v1/collections/{id}", delete(collections::delete_collection))
        .route(
            "/api/v1/collections/{id}/items",
            post(collections::add_collection_item),
        )
        .route(
            "/api/v1/collections/{id}/items/{item_id}",
            delete(collections::remove_collection_item),
        )
        // Bulk
        .route("/api/v1/bulk", post(bulk::create_bulk_scan))
        .route("/api/v1/bulk", get(bulk::list_bulk_jobs))
        .route("/api/v1/bulk/{id}", get(bulk::get_bulk_job))
        // History
        .route("/api/v1/history/{hash}", get(history::get_history))
        // Radar
        .route("/api/v1/radar", get(radar::get_radar_events))
        .route("/api/v1/radar/trends", get(radar::get_radar_events))
        // Billing
        .route("/api/v1/billing/checkout", post(billing::create_checkout))
        .route("/api/v1/billing/portal", post(billing::create_portal))
        // Profiles
        .route(
            "/api/v1/users/profile",
            get(profiles::get_my_profile).put(profiles::update_profile),
        )
        .route(
            "/api/v1/users/{username}",
            get(profiles::get_public_profile),
        )
        .route(
            "/api/v1/users/{username}/scans",
            get(profiles::get_user_scans),
        )
        .route(
            "/api/v1/users/{username}/badges",
            get(profiles::get_user_badges),
        )
        // Follows
        .route("/api/v1/follow/user/{id}", post(follows::follow_user))
        .route("/api/v1/follow/user/{id}", delete(follows::unfollow_user))
        .route("/api/v1/follow/domain", post(follows::follow_domain))
        .route("/api/v1/follow/domain", delete(follows::unfollow_domain))
        .route("/api/v1/following", get(follows::list_following))
        .route("/api/v1/followers", get(follows::list_followers))
        .route("/api/v1/notifications", get(follows::list_notifications))
        .route(
            "/api/v1/notifications/read",
            put(follows::mark_notifications_read),
        )
        // Leaderboard & Achievements
        .route("/api/v1/leaderboard", get(leaderboard::get_leaderboard))
        .route("/api/v1/achievements", get(leaderboard::get_achievements))
        .route(
            "/api/v1/achievements/check",
            get(leaderboard::check_achievements),
        )
        // Enrichment API (Clearbit replacement)
        .route("/api/v1/enrich", post(enrichment::enrich_domain))
        .route("/api/v1/enrich/{domain}", get(enrichment::enrich_domain_get))
        .route(
            "/api/v1/enrich/{domain}/company",
            get(enrichment::enrich_company),
        )
        .route(
            "/api/v1/enrich/{domain}/tech",
            get(enrichment::enrich_tech),
        )
        .route(
            "/api/v1/enrich/{domain}/security",
            get(enrichment::enrich_security),
        )
        // Domain Verification (Feature #48-49)
        .route("/api/v1/domains/verify", post(domains::start_verification))
        .route(
            "/api/v1/domains/verify/{id}/check",
            post(domains::check_verification),
        )
        .route("/api/v1/domains", get(domains::list_domains))
        .route("/api/v1/domains/{id}", delete(domains::delete_domain))
        // Deep Scan (Feature #62)
        .route("/api/v1/deep-scan", post(deep_scan::start_deep_scan))
        .route("/api/v1/deep-scan", get(deep_scan::list_deep_scans))
        .route("/api/v1/deep-scan/{id}", get(deep_scan::get_deep_scan))
        .route("/api/v1/deep-scan/{id}/cancel", post(deep_scan::cancel_deep_scan))
        // Attack Surface Audit
        .route("/api/v1/attack-surface", post(attack_surface::start_audit).get(attack_surface::list_audits))
        .route("/api/v1/attack-surface/{id}", get(attack_surface::get_audit))
        .route("/api/v1/attack-surface/{id}/cancel", post(attack_surface::cancel_audit))
        .route("/api/v1/attack-surface/{id}/pair", post(attack_surface::pair_audit))
        // Domain Scan (Unified Orchestrator)
        .route("/api/v1/domain-scan", post(domain_scan::start_scan))
        .route("/api/v1/domain-scan", get(domain_scan::list_scans))
        .route("/api/v1/domain-scan/{id}", get(domain_scan::get_scan))
        .route("/api/v1/domain-scan/{id}/cancel", post(domain_scan::cancel_scan))
        // Offensive Scanning
        .route("/api/v1/offensive-scan", post(offensive::start_scan).get(offensive::list_scans))
        .route("/api/v1/offensive-scan/scope-contract", post(offensive::create_scope_contract))
        .route("/api/v1/offensive-scan/scope-contracts", get(offensive::list_scope_contracts))
        .route("/api/v1/offensive-scan/{id}", get(offensive::get_scan))
        .route("/api/v1/offensive-scan/{id}/cancel", post(offensive::cancel_scan))
        .route("/api/v1/offensive-scan/{id}/kill", post(offensive::kill_scan))
        .route("/api/v1/offensive-scan/{id}/confirm-risk", post(offensive::confirm_risk))
        .route("/api/v1/offensive-scan/{id}/confirm-targets", post(offensive::confirm_targets))
        .route("/api/v1/offensive-scan/{id}/replay", get(offensive::get_scan_replay))
        // Mobile Scanning
        .route("/api/v1/mobile-scan", post(mobile::upload_and_start))
        .route("/api/v1/mobile-scan/url", post(mobile::scan_from_url))
        .route("/api/v1/mobile-scan", get(mobile::list_scans))
        .route("/api/v1/mobile-scan/{id}", get(mobile::get_scan))
        .route("/api/v1/mobile-scan/{id}/cancel", post(mobile::cancel_scan))
        // Extension Scanning
        .route(
            "/api/v1/extension-scan",
            post(extension::upload_and_start).get(extension::list_scans),
        )
        .route("/api/v1/extension-scan/{id}", get(extension::get_scan))
        .route("/api/v1/extension-scan/{id}/cancel", post(extension::cancel_scan))
        // API Spec Scanning
        .route(
            "/api/v1/api-spec-scan",
            post(api_spec::start_scan).get(api_spec::list_scans),
        )
        .route("/api/v1/api-spec-scan/{id}", get(api_spec::get_scan))
        .route("/api/v1/api-spec-scan/{id}/cancel", post(api_spec::cancel_scan))
        // Monitoring (Features #51-52, #56, #61)
        .route(
            "/api/v1/monitors/uptime",
            post(monitoring::create_uptime_monitor),
        )
        .route(
            "/api/v1/monitors/uptime",
            get(monitoring::list_uptime_monitors),
        )
        .route(
            "/api/v1/monitors/uptime/{id}",
            get(monitoring::get_uptime_monitor),
        )
        .route(
            "/api/v1/monitors/uptime/{id}",
            delete(monitoring::delete_uptime_monitor),
        )
        .route("/api/v1/monitors/ssl", post(monitoring::create_ssl_monitor))
        .route("/api/v1/monitors/ssl", get(monitoring::list_ssl_monitors))
        .route(
            "/api/v1/monitors/ssl/{id}",
            delete(monitoring::delete_ssl_monitor),
        )
        .route(
            "/api/v1/monitors/ssl/{id}",
            put(monitoring::update_ssl_monitor),
        )
        .route(
            "/api/v1/monitors/speed",
            post(monitoring::trigger_speed_measurement),
        )
        .route(
            "/api/v1/monitors/speed/{id_or_domain}/history",
            get(monitoring::get_speed_history),
        )
        .route(
            "/api/v1/monitors/speed/{id_or_domain}",
            get(monitoring::get_speed_history).delete(monitoring::delete_speed_tracker),
        )
        .route(
            "/api/v1/monitors/speed/{id}/measure",
            post(monitoring::trigger_speed_measurement_by_id),
        )
        .route(
            "/api/v1/monitors/reports",
            post(monitoring::create_scheduled_report),
        )
        .route(
            "/api/v1/monitors/reports",
            get(monitoring::list_scheduled_reports),
        )
        .route(
            "/api/v1/monitoring/summary",
            get(monitoring::get_monitoring_summary),
        )
        .route(
            "/api/v1/monitoring/alerts",
            get(monitoring::get_monitoring_alerts),
        )
        // Lead Generation + Contact Database
        .route("/api/v1/leads/search", get(leads::search_leads))
        .route("/api/v1/leads/technologies", get(leads::list_technologies))
        .route("/api/v1/leads/export", get(leads::export_leads))
        .route(
            "/api/v1/leads/domain/{domain}",
            get(leads::get_domain_profile),
        )
        // Traffic data
        .route("/api/v1/traffic/{domain}", get(leads::get_traffic))
        // AI Visibility
        .route(
            "/api/v1/ai-visibility",
            post(ai_visibility::start_check),
        )
        .route(
            "/api/v1/ai-visibility",
            get(ai_visibility::list_checks),
        )
        .route(
            "/api/v1/ai-visibility/{id}",
            get(ai_visibility::get_check),
        )
        // Brand Mentions
        .route(
            "/api/v1/mentions/scan",
            post(mentions::scan_mentions),
        )
        .route(
            "/api/v1/mentions",
            get(mentions::list_mentions),
        )
        .route(
            "/api/v1/mentions/summary",
            get(mentions::mention_summary),
        )
        // Thread Discovery
        .route(
            "/api/v1/threads/discover",
            post(threads::discover_threads),
        )
        .route(
            "/api/v1/threads",
            get(threads::list_threads),
        )
        .route(
            "/api/v1/threads/{id}",
            get(threads::get_thread),
        )
        .route(
            "/api/v1/threads/{id}/draft",
            post(threads::draft_reply),
        )
        .route(
            "/api/v1/threads/{id}/status",
            put(threads::update_thread_status),
        )
        .route("/api/v1/webhooks", post(webhooks::create_webhook))
        .route("/api/v1/webhooks", get(webhooks::list_webhooks))
        .route(
            "/api/v1/webhooks/{id}",
            delete(webhooks::delete_webhook).patch(webhooks::update_webhook),
        )
        .layer(middleware::from_fn_with_state(
            state.clone(),
            rate_limit_middleware,
        ))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .layer(DefaultBodyLimit::max(250 * 1024 * 1024));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .with_state(state)
}
