-- Domain Scans: Unified orchestrator for web security scan modes
-- (security, pentest, api) that links to existing child scan tables.

CREATE TABLE IF NOT EXISTS domain_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('security', 'pentest', 'api')),
  status TEXT NOT NULL DEFAULT 'pending',
  -- Links to child scans (orchestrated by this domain scan)
  deep_scan_id UUID REFERENCES deep_scans(id),
  attack_surface_id UUID REFERENCES attack_surface_audits(id),
  offensive_scan_id UUID REFERENCES offensive_scans(id),
  api_spec_scan_id UUID REFERENCES api_spec_scans(id),
  scope_contract_id UUID REFERENCES scope_contracts(id),
  -- Aggregated results
  total_findings INT NOT NULL DEFAULT 0,
  severity_critical INT NOT NULL DEFAULT 0,
  severity_high INT NOT NULL DEFAULT 0,
  severity_medium INT NOT NULL DEFAULT 0,
  severity_low INT NOT NULL DEFAULT 0,
  severity_info INT NOT NULL DEFAULT 0,
  -- Config
  scope JSONB NOT NULL DEFAULT '{}',
  rate_limit TEXT NOT NULL DEFAULT 'moderate',
  spec_content TEXT, -- For API mode
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_scans_user ON domain_scans(user_id);
CREATE INDEX idx_domain_scans_domain ON domain_scans(domain);
CREATE INDEX idx_domain_scans_status ON domain_scans(status);
