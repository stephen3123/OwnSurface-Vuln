-- Migration 026: Traffic history table

CREATE TABLE IF NOT EXISTS traffic_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    tranco_rank INTEGER,
    traffic_tier TEXT,
    estimated_monthly_visits TEXT,
    composite_score INTEGER,
    crux_lcp_ms INTEGER,
    crux_fid_ms INTEGER,
    crux_cls REAL,
    data_sources TEXT[] DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_history_domain_date ON traffic_history (domain, recorded_at DESC);
