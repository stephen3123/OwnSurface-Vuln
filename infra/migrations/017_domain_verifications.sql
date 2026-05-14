CREATE TABLE IF NOT EXISTS domain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    verification_method TEXT NOT NULL DEFAULT 'dns_txt',
    verification_token TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, domain)
);
CREATE INDEX idx_domain_verifications_user ON domain_verifications(user_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);
