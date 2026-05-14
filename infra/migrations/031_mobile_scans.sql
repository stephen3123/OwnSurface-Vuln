-- Mobile app security scans table
CREATE TABLE IF NOT EXISTS mobile_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_name TEXT,
    package_name TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
    scan_mode TEXT NOT NULL DEFAULT 'security_audit' CHECK (scan_mode IN ('appstore_check', 'security_audit', 'offensive_pentest')),
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_sha256 TEXT NOT NULL,
    scope JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    findings JSONB NOT NULL DEFAULT '[]',
    logs JSONB NOT NULL DEFAULT '[]',
    severity_critical INTEGER NOT NULL DEFAULT 0,
    severity_high INTEGER NOT NULL DEFAULT 0,
    severity_medium INTEGER NOT NULL DEFAULT 0,
    severity_low INTEGER NOT NULL DEFAULT 0,
    severity_info INTEGER NOT NULL DEFAULT 0,
    tools_used TEXT[] NOT NULL DEFAULT '{}',
    app_metadata JSONB,
    api_endpoints_found TEXT[] NOT NULL DEFAULT '{}',
    framework_detected TEXT,
    offensive_scan_id UUID REFERENCES offensive_scans(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_scans_user_id ON mobile_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_scans_status ON mobile_scans(status);
CREATE INDEX IF NOT EXISTS idx_mobile_scans_platform ON mobile_scans(platform);
CREATE INDEX IF NOT EXISTS idx_mobile_scans_file_hash ON mobile_scans(file_hash_sha256);
CREATE INDEX IF NOT EXISTS idx_mobile_scans_created_at ON mobile_scans(created_at DESC);
