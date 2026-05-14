CREATE TABLE IF NOT EXISTS api_spec_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    domain_verification_id UUID REFERENCES domain_verifications(id),
    spec_format TEXT NOT NULL DEFAULT 'openapi3' CHECK (spec_format IN ('openapi3', 'openapi2', 'swagger')),
    endpoints_found INTEGER NOT NULL DEFAULT 0,
    scope JSONB NOT NULL DEFAULT '{}',
    rate_limit TEXT NOT NULL DEFAULT 'moderate',
    status TEXT NOT NULL DEFAULT 'pending',
    findings JSONB NOT NULL DEFAULT '[]',
    logs JSONB NOT NULL DEFAULT '[]',
    severity_critical INTEGER NOT NULL DEFAULT 0,
    severity_high INTEGER NOT NULL DEFAULT 0,
    severity_medium INTEGER NOT NULL DEFAULT 0,
    severity_low INTEGER NOT NULL DEFAULT 0,
    severity_info INTEGER NOT NULL DEFAULT 0,
    tools_used TEXT[] NOT NULL DEFAULT '{}',
    spec_issues JSONB NOT NULL DEFAULT '[]',
    offensive_scan_id UUID REFERENCES offensive_scans(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_spec_scans_user_id ON api_spec_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_api_spec_scans_status ON api_spec_scans(status);
CREATE INDEX IF NOT EXISTS idx_api_spec_scans_created_at ON api_spec_scans(created_at DESC);
