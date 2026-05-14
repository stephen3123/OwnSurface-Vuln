use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::Instant;

/// Lightweight Prometheus-compatible metrics using atomic counters.
pub struct Metrics {
    pub http_requests_total: AtomicU64,
    pub http_errors_total: AtomicU64,
    pub scan_requests_total: AtomicU64,
    pub active_connections: AtomicI64,
    startup_time: Instant,
}

static INSTANCE: OnceLock<Metrics> = OnceLock::new();

impl Metrics {
    fn new() -> Self {
        Self {
            http_requests_total: AtomicU64::new(0),
            http_errors_total: AtomicU64::new(0),
            scan_requests_total: AtomicU64::new(0),
            active_connections: AtomicI64::new(0),
            startup_time: Instant::now(),
        }
    }

    pub fn global() -> &'static Metrics {
        INSTANCE.get_or_init(Metrics::new)
    }

    pub fn uptime_seconds(&self) -> f64 {
        self.startup_time.elapsed().as_secs_f64()
    }
}

/// Increment the total HTTP request counter.
pub fn increment_requests() {
    Metrics::global()
        .http_requests_total
        .fetch_add(1, Ordering::Relaxed);
}

/// Increment the HTTP error counter (4xx + 5xx responses).
pub fn increment_errors() {
    Metrics::global()
        .http_errors_total
        .fetch_add(1, Ordering::Relaxed);
}

/// Increment the scan request counter.
pub fn increment_scans() {
    Metrics::global()
        .scan_requests_total
        .fetch_add(1, Ordering::Relaxed);
}

/// Increment active connection gauge.
pub fn connection_opened() {
    Metrics::global()
        .active_connections
        .fetch_add(1, Ordering::Relaxed);
}

/// Decrement active connection gauge.
pub fn connection_closed() {
    Metrics::global()
        .active_connections
        .fetch_sub(1, Ordering::Relaxed);
}

/// Render all metrics in Prometheus text exposition format.
pub fn get_metrics_text() -> String {
    let m = Metrics::global();

    let requests = m.http_requests_total.load(Ordering::Relaxed);
    let errors = m.http_errors_total.load(Ordering::Relaxed);
    let scans = m.scan_requests_total.load(Ordering::Relaxed);
    let active = m.active_connections.load(Ordering::Relaxed);
    let uptime = m.uptime_seconds();

    format!(
        "\
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total {requests}

# HELP http_errors_total Total HTTP error responses (4xx + 5xx)
# TYPE http_errors_total counter
http_errors_total {errors}

# HELP scan_requests_total Total scan requests submitted
# TYPE scan_requests_total counter
scan_requests_total {scans}

# HELP active_connections Current number of active connections
# TYPE active_connections gauge
active_connections {active}

# HELP uptime_seconds Seconds since server startup
# TYPE uptime_seconds gauge
uptime_seconds {uptime:.3}
"
    )
}
