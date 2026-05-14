-- Migration 028: Fix missing ON DELETE CASCADE/SET NULL constraints and add missing indexes
-- This migration drops and re-adds foreign key constraints with proper cascade behavior.

-- 1. scans.user_id → CASCADE
ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_user_id_fkey;
ALTER TABLE scans ADD CONSTRAINT scans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. watchlists.team_id → add FK constraint with CASCADE (was missing entirely)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'watchlists_team_id_fkey' AND table_name = 'watchlists'
  ) THEN
    ALTER TABLE watchlists ADD CONSTRAINT watchlists_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. team_invitations.invited_by → SET NULL
ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_invited_by_fkey;
ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. reports.user_id → CASCADE
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. scan_history.user_id → CASCADE
ALTER TABLE scan_history DROP CONSTRAINT IF EXISTS scan_history_user_id_fkey;
ALTER TABLE scan_history ADD CONSTRAINT scan_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. bulk_jobs.user_id → CASCADE
ALTER TABLE bulk_jobs DROP CONSTRAINT IF EXISTS bulk_jobs_user_id_fkey;
ALTER TABLE bulk_jobs ADD CONSTRAINT bulk_jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. published_scans.scan_id → CASCADE
ALTER TABLE published_scans DROP CONSTRAINT IF EXISTS published_scans_scan_id_fkey;
ALTER TABLE published_scans ADD CONSTRAINT published_scans_scan_id_fkey
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE;

-- 8. collection_items.scan_id → CASCADE
ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_scan_id_fkey;
ALTER TABLE collection_items ADD CONSTRAINT collection_items_scan_id_fkey
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE;

-- 9. deep_scans.verification_id → CASCADE
ALTER TABLE deep_scans DROP CONSTRAINT IF EXISTS deep_scans_verification_id_fkey;
ALTER TABLE deep_scans ADD CONSTRAINT deep_scans_verification_id_fkey
  FOREIGN KEY (verification_id) REFERENCES domain_verifications(id) ON DELETE CASCADE;

-- 10. uptime_monitors.verification_id → CASCADE
ALTER TABLE uptime_monitors DROP CONSTRAINT IF EXISTS uptime_monitors_verification_id_fkey;
ALTER TABLE uptime_monitors ADD CONSTRAINT uptime_monitors_verification_id_fkey
  FOREIGN KEY (verification_id) REFERENCES domain_verifications(id) ON DELETE CASCADE;

-- 11. ssl_monitors.verification_id → CASCADE
ALTER TABLE ssl_monitors DROP CONSTRAINT IF EXISTS ssl_monitors_verification_id_fkey;
ALTER TABLE ssl_monitors ADD CONSTRAINT ssl_monitors_verification_id_fkey
  FOREIGN KEY (verification_id) REFERENCES domain_verifications(id) ON DELETE CASCADE;

-- 12. speed_measurements.user_id → CASCADE
ALTER TABLE speed_measurements DROP CONSTRAINT IF EXISTS speed_measurements_user_id_fkey;
ALTER TABLE speed_measurements ADD CONSTRAINT speed_measurements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 13. scheduled_reports.verification_id → CASCADE
ALTER TABLE scheduled_reports DROP CONSTRAINT IF EXISTS scheduled_reports_verification_id_fkey;
ALTER TABLE scheduled_reports ADD CONSTRAINT scheduled_reports_verification_id_fkey
  FOREIGN KEY (verification_id) REFERENCES domain_verifications(id) ON DELETE CASCADE;

-- 14. attack_surface_audits.verification_id → CASCADE
ALTER TABLE attack_surface_audits DROP CONSTRAINT IF EXISTS attack_surface_audits_verification_id_fkey;
ALTER TABLE attack_surface_audits ADD CONSTRAINT attack_surface_audits_verification_id_fkey
  FOREIGN KEY (verification_id) REFERENCES domain_verifications(id) ON DELETE CASCADE;

-- 15. Add missing index on scans.url for lookup performance
CREATE INDEX IF NOT EXISTS idx_scans_url ON scans(url);
