-- Bulk scan jobs
CREATE TABLE IF NOT EXISTS bulk_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total_urls INT NOT NULL,
    completed_urls INT DEFAULT 0,
    failed_urls INT DEFAULT 0,
    urls TEXT[] NOT NULL,
    results JSONB,
    error_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bulk_jobs_user ON bulk_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON bulk_jobs(status) WHERE status IN ('pending', 'processing');
