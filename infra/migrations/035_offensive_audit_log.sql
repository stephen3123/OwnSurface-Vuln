-- Immutable audit log for offensive scanning operations
-- Partitioned by created_at for efficient time-range queries
CREATE TABLE IF NOT EXISTS offensive_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    target_host TEXT,
    target_ip TEXT,
    decision TEXT NOT NULL DEFAULT 'allow'
        CHECK (decision IN ('allow', 'block', 'warn', 'kill')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions (quarterly)
CREATE TABLE IF NOT EXISTS offensive_audit_log_2026_q1
    PARTITION OF offensive_audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS offensive_audit_log_2026_q2
    PARTITION OF offensive_audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS offensive_audit_log_2026_q3
    PARTITION OF offensive_audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS offensive_audit_log_2026_q4
    PARTITION OF offensive_audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_scan_id ON offensive_audit_log(scan_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON offensive_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON offensive_audit_log(event_type);

-- Append-only trigger: prevent updates and deletes
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'offensive_audit_log is append-only. Updates and deletes are not permitted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON offensive_audit_log;
CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON offensive_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();
