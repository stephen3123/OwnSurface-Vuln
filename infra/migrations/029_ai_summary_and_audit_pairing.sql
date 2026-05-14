-- 029: Add ai_summary column to attack_surface_audits and add full audit pairing columns

-- 1. Add ai_summary column (worker writes this, API reads it)
ALTER TABLE attack_surface_audits ADD COLUMN IF NOT EXISTS ai_summary TEXT NOT NULL DEFAULT '';

-- 2. Add paired_deep_scan_id to attack_surface_audits (links probe → deep scan in full audit)
ALTER TABLE attack_surface_audits ADD COLUMN IF NOT EXISTS paired_deep_scan_id UUID REFERENCES deep_scans(id) ON DELETE SET NULL;

-- 3. Add paired_audit_id to deep_scans (links deep scan → probe in full audit)
ALTER TABLE deep_scans ADD COLUMN IF NOT EXISTS paired_audit_id UUID REFERENCES attack_surface_audits(id) ON DELETE SET NULL;

-- Index for quick lookup of paired scans
CREATE INDEX IF NOT EXISTS idx_attack_surface_paired_deep ON attack_surface_audits(paired_deep_scan_id) WHERE paired_deep_scan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deep_scans_paired_audit ON deep_scans(paired_audit_id) WHERE paired_audit_id IS NOT NULL;
