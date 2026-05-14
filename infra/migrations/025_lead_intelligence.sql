-- Migration 025: Lead intelligence tables (technology_index + domain_profiles)

-- Technology index: one row per (domain, technology) pair
CREATE TABLE IF NOT EXISTS technology_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    technology_name TEXT NOT NULL,
    category TEXT,
    version TEXT,
    confidence REAL DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(domain, technology_name)
);

CREATE INDEX IF NOT EXISTS idx_technology_index_tech_name ON technology_index (technology_name);
CREATE INDEX IF NOT EXISTS idx_technology_index_category ON technology_index (category);
CREATE INDEX IF NOT EXISTS idx_technology_index_domain ON technology_index (domain);
CREATE INDEX IF NOT EXISTS idx_technology_index_tech_last_seen ON technology_index (technology_name, last_seen DESC);

-- Domain profiles: one row per domain, denormalized company + contact data
CREATE TABLE IF NOT EXISTS domain_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    url TEXT,
    company_name TEXT,
    description TEXT,
    industry TEXT,
    location TEXT,
    employees_range TEXT,
    founded TEXT,
    logo_url TEXT,
    tranco_rank INTEGER,
    traffic_tier TEXT,
    estimated_monthly_visits TEXT,
    email_pattern TEXT,
    found_emails TEXT[] DEFAULT '{}',
    contact_page_url TEXT,
    team_page_url TEXT,
    social_links JSONB DEFAULT '{}',
    security_grade TEXT,
    security_score INTEGER,
    seo_score INTEGER,
    has_pricing BOOLEAN DEFAULT FALSE,
    has_careers BOOLEAN DEFAULT FALSE,
    is_hiring BOOLEAN DEFAULT FALSE,
    payment_processors TEXT[] DEFAULT '{}',
    chat_widgets TEXT[] DEFAULT '{}',
    ad_pixels TEXT[] DEFAULT '{}',
    first_scanned TIMESTAMPTZ DEFAULT NOW(),
    last_scanned TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_domain_profiles_fts ON domain_profiles
    USING GIN (to_tsvector('english', COALESCE(company_name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(domain, '')));

CREATE INDEX IF NOT EXISTS idx_domain_profiles_industry ON domain_profiles (industry);
CREATE INDEX IF NOT EXISTS idx_domain_profiles_employees ON domain_profiles (employees_range);
CREATE INDEX IF NOT EXISTS idx_domain_profiles_traffic ON domain_profiles (traffic_tier);
CREATE INDEX IF NOT EXISTS idx_domain_profiles_location ON domain_profiles (location);
CREATE INDEX IF NOT EXISTS idx_domain_profiles_tranco ON domain_profiles (tranco_rank);
CREATE INDEX IF NOT EXISTS idx_domain_profiles_last_scanned ON domain_profiles (last_scanned DESC);
