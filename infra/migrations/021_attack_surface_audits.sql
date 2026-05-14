CREATE TABLE IF NOT EXISTS attack_surface_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_id UUID NOT NULL REFERENCES domain_verifications(id),
    status TEXT NOT NULL DEFAULT 'pending',
    scope JSONB NOT NULL DEFAULT '{}',
    rate_limit TEXT NOT NULL DEFAULT 'moderate',
    findings JSONB NOT NULL DEFAULT '[]',
    logs JSONB NOT NULL DEFAULT '[]',
    severity_critical INTEGER NOT NULL DEFAULT 0,
    severity_high INTEGER NOT NULL DEFAULT 0,
    severity_medium INTEGER NOT NULL DEFAULT 0,
    severity_low INTEGER NOT NULL DEFAULT 0,
    severity_info INTEGER NOT NULL DEFAULT 0,
    tier1_status TEXT NOT NULL DEFAULT 'pending',
    tier2_status TEXT NOT NULL DEFAULT 'pending',
    tier3_status TEXT NOT NULL DEFAULT 'pending',
    consent_ip TEXT,
    consent_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attack_surface_audits_user ON attack_surface_audits(user_id);
CREATE INDEX idx_attack_surface_audits_domain ON attack_surface_audits(domain);
CREATE INDEX idx_attack_surface_audits_status ON attack_surface_audits(status);
