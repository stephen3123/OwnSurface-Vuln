ALTER TABLE api_spec_scans
ADD COLUMN IF NOT EXISTS endpoint_inventory JSONB NOT NULL DEFAULT '[]';

ALTER TABLE api_spec_scans
ADD COLUMN IF NOT EXISTS coverage_summary JSONB NOT NULL DEFAULT '{}';
