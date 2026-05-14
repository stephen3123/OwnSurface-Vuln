-- Browser extension security scans table
CREATE TABLE IF NOT EXISTS extension_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    extension_name TEXT,
    extension_id TEXT,
    manifest_version INTEGER,
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
    permissions_declared TEXT[] NOT NULL DEFAULT '{}',
    host_permissions TEXT[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extension_scans_user_id ON extension_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_scans_status ON extension_scans(status);
CREATE INDEX IF NOT EXISTS idx_extension_scans_created_at ON extension_scans(created_at DESC);
