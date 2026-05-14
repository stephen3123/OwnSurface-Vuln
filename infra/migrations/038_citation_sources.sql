-- Migration 038: Citation sources for AI visibility checks

CREATE TABLE IF NOT EXISTS ai_visibility_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES ai_visibility_checks(id) ON DELETE CASCADE,
    result_id UUID REFERENCES ai_visibility_results(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'other',
    source_title TEXT,
    platform TEXT,
    is_gap_source BOOLEAN DEFAULT FALSE,
    competitor_name TEXT,
    discovered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_check ON ai_visibility_citations(check_id);
CREATE INDEX IF NOT EXISTS idx_citations_platform ON ai_visibility_citations(platform);
CREATE INDEX IF NOT EXISTS idx_citations_gap ON ai_visibility_citations(is_gap_source) WHERE is_gap_source = TRUE;
