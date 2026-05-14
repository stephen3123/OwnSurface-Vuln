-- Add App Store / Play Store readiness verdict to mobile scans
ALTER TABLE mobile_scans ADD COLUMN IF NOT EXISTS verdict jsonb DEFAULT NULL;
COMMENT ON COLUMN mobile_scans.verdict IS 'App Store/Play Store readiness: {verdict: pass|fail|warning, blockers: [], warnings: [], passed: []}';
