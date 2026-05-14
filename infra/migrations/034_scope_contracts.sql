-- Scope contracts: legal agreement defining what targets are in-scope for offensive scanning
CREATE TABLE IF NOT EXISTS scope_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    domain_verification_id UUID REFERENCES domain_verifications(id),

    -- Scope definition
    scope_mode TEXT NOT NULL DEFAULT 'root_only'
        CHECK (scope_mode IN ('root_only', 'include_subs', 'custom_list')),
    included_targets TEXT[] NOT NULL DEFAULT '{}',
    excluded_targets TEXT[] NOT NULL DEFAULT '{}',
    ip_ranges TEXT[] NOT NULL DEFAULT '{}',
    include_third_party BOOLEAN NOT NULL DEFAULT false,

    -- Legal evidence
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signer_ip TEXT NOT NULL,
    signer_user_agent TEXT NOT NULL DEFAULT '',
    legal_version TEXT NOT NULL DEFAULT '1.0',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scope_contracts_user_id ON scope_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_scope_contracts_domain ON scope_contracts(domain);
CREATE INDEX IF NOT EXISTS idx_scope_contracts_expires_at ON scope_contracts(expires_at);

-- Link offensive scans to scope contracts
ALTER TABLE offensive_scans ADD COLUMN IF NOT EXISTS scope_contract_id UUID REFERENCES scope_contracts(id);
ALTER TABLE offensive_scans ADD COLUMN IF NOT EXISTS safety_score INTEGER;
ALTER TABLE offensive_scans ADD COLUMN IF NOT EXISTS safety_grade TEXT;

-- DNS re-verification tracking
ALTER TABLE domain_verifications ADD COLUMN IF NOT EXISTS last_reverified_at TIMESTAMPTZ;
ALTER TABLE domain_verifications ADD COLUMN IF NOT EXISTS reverification_failures INTEGER NOT NULL DEFAULT 0;
