-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  credentials TEXT,
  title TEXT,
  practice_name TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'CA',
  zip TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  linkedin_url TEXT,
  telehealth_available BOOLEAN DEFAULT FALSE,
  insurance_accepted TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{English}',
  education TEXT,
  slug TEXT UNIQUE NOT NULL,
  city_slug TEXT NOT NULL,
  state_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_providers_state_slug ON providers(state_slug);
CREATE INDEX idx_providers_city_slug ON providers(city_slug);
CREATE INDEX idx_providers_slug ON providers(slug);
CREATE INDEX idx_providers_specialties ON providers USING GIN(specialties);
CREATE INDEX idx_providers_city_state ON providers(city_slug, state_slug);

-- City stats view
CREATE OR REPLACE VIEW city_stats AS
SELECT
  city,
  city_slug,
  state,
  state_slug,
  COUNT(*) as provider_count
FROM providers
GROUP BY city, city_slug, state, state_slug;

-- Specialty stats view
CREATE OR REPLACE VIEW specialty_stats AS
SELECT
  unnest(specialties) as name,
  LOWER(REGEXP_REPLACE(REPLACE(unnest(specialties), '''', ''), '[^a-zA-Z0-9]+', '-', 'g')) as slug,
  COUNT(*) as provider_count
FROM providers
GROUP BY unnest(specialties);

-- State stats view
CREATE OR REPLACE VIEW state_stats AS
SELECT
  state,
  state_slug,
  COUNT(*) as provider_count,
  COUNT(DISTINCT city) as city_count
FROM providers
GROUP BY state, state_slug;

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON providers
  FOR SELECT USING (true);
