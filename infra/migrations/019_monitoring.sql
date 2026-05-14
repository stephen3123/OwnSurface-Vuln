-- Uptime monitors
CREATE TABLE IF NOT EXISTS uptime_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_id UUID NOT NULL REFERENCES domain_verifications(id),
    check_interval_seconds INTEGER NOT NULL DEFAULT 300,
    expected_status_code INTEGER NOT NULL DEFAULT 200,
    alert_email BOOLEAN NOT NULL DEFAULT true,
    alert_slack_webhook TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMPTZ,
    last_status TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_uptime_monitors_user ON uptime_monitors(user_id);
CREATE INDEX idx_uptime_monitors_active ON uptime_monitors(is_active) WHERE is_active = true;
CREATE INDEX idx_uptime_monitors_next_check ON uptime_monitors(last_checked_at, check_interval_seconds) WHERE is_active = true;

-- Uptime check results
CREATE TABLE IF NOT EXISTS uptime_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES uptime_monitors(id) ON DELETE CASCADE,
    status_code INTEGER,
    response_time_ms INTEGER,
    is_up BOOLEAN NOT NULL,
    error TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_uptime_checks_monitor ON uptime_checks(monitor_id, checked_at DESC);

-- SSL certificate monitors
CREATE TABLE IF NOT EXISTS ssl_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_id UUID NOT NULL REFERENCES domain_verifications(id),
    alert_days_before_expiry INTEGER NOT NULL DEFAULT 30,
    issuer TEXT,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    protocol TEXT,
    serial_number TEXT,
    subject_alt_names TEXT[],
    last_checked_at TIMESTAMPTZ,
    is_valid BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, domain)
);
CREATE INDEX idx_ssl_monitors_user ON ssl_monitors(user_id);
CREATE INDEX idx_ssl_monitors_expiry ON ssl_monitors(valid_to) WHERE valid_to IS NOT NULL;

-- Speed / Core Web Vitals measurements
CREATE TABLE IF NOT EXISTS speed_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    lcp_ms DOUBLE PRECISION,
    fid_ms DOUBLE PRECISION,
    cls DOUBLE PRECISION,
    ttfb_ms DOUBLE PRECISION,
    inp_ms DOUBLE PRECISION,
    page_weight_bytes BIGINT,
    request_count INTEGER,
    dom_content_loaded_ms DOUBLE PRECISION,
    load_time_ms DOUBLE PRECISION,
    performance_score INTEGER,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_speed_measurements_user ON speed_measurements(user_id);
CREATE INDEX idx_speed_measurements_domain ON speed_measurements(domain, measured_at DESC);

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_id UUID NOT NULL REFERENCES domain_verifications(id),
    report_type TEXT NOT NULL DEFAULT 'weekly',
    include_uptime BOOLEAN NOT NULL DEFAULT true,
    include_ssl BOOLEAN NOT NULL DEFAULT true,
    include_speed BOOLEAN NOT NULL DEFAULT true,
    include_security BOOLEAN NOT NULL DEFAULT true,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduled_reports_user ON scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next ON scheduled_reports(next_send_at) WHERE is_active = true;
