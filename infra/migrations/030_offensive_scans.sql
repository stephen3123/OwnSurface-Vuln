-- Offensive security scans table
CREATE TABLE IF NOT EXISTS offensive_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    domain_verification_id UUID REFERENCES domain_verifications(id),
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
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offensive_scans_user_id ON offensive_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_offensive_scans_domain ON offensive_scans(domain);
CREATE INDEX IF NOT EXISTS idx_offensive_scans_status ON offensive_scans(status);
CREATE INDEX IF NOT EXISTS idx_offensive_scans_created_at ON offensive_scans(created_at DESC);

-- Add tier4_status column to existing attack_surface_audits table
ALTER TABLE attack_surface_audits ADD COLUMN IF NOT EXISTS tier4_status TEXT DEFAULT 'pending';
