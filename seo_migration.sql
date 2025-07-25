-- Add missing SEO analytics columns to seo_analysis_data table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100);
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS search_volume INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS keyword_difficulty INTEGER DEFAULT 0 CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100);
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS content_suggestions TEXT[] DEFAULT '{}';
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS competitor_analysis JSONB DEFAULT '{}';
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS title_length INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS description_length INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS keyword_density DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS readability_score INTEGER DEFAULT 0;

-- Verify the columns were added
\d seo_analysis_data;
