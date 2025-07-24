-- =====================================================
-- CREATE MARKET_RESEARCH_DATA TABLE - MISSING TABLE
-- =====================================================
-- This table was referenced in types and migrations but never created
-- Run this in your Supabase SQL editor BEFORE running other migrations

CREATE TABLE IF NOT EXISTS market_research_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Core pricing data
  msrp DECIMAL(10,2),
  competitive_price DECIMAL(10,2),
  lowest_competitor_price DECIMAL(10,2),
  highest_competitor_price DECIMAL(10,2),
  average_competitor_price DECIMAL(10,2),
  
  -- Amazon competitive data
  amazon_price DECIMAL(10,2),
  amazon_url TEXT,
  amazon_prime_available BOOLEAN DEFAULT NULL,
  amazon_seller_type TEXT,
  amazon_rating DECIMAL(3,1),
  amazon_review_count INTEGER,
  amazon_search_results_url TEXT,
  amazon_verified BOOLEAN DEFAULT false,
  amazon_last_checked TIMESTAMP WITH TIME ZONE,
  amazon_confidence DECIMAL(3,2) DEFAULT 0.00,
  
  -- eBay competitive data
  ebay_price DECIMAL(10,2),
  ebay_url TEXT,
  ebay_new_price_min DECIMAL(10,2),
  ebay_new_price_max DECIMAL(10,2),
  ebay_used_price_min DECIMAL(10,2),
  ebay_used_price_max DECIMAL(10,2),
  ebay_recent_sold_average DECIMAL(10,2),
  ebay_search_results_url TEXT,
  ebay_sold_listings_url TEXT,
  ebay_verified BOOLEAN DEFAULT false,
  ebay_last_checked TIMESTAMP WITH TIME ZONE,
  ebay_confidence DECIMAL(3,2) DEFAULT 0.00,
  ebay_seller_rating DECIMAL(3,2),
  ebay_shipping_cost NUMERIC(10,2),
  ebay_condition TEXT,
  ebay_listings_count INTEGER DEFAULT 0,
  ebay_sold_count INTEGER DEFAULT 0,
  ebay_last_updated TIMESTAMP WITH TIME ZONE,
  
  -- Other marketplace data
  facebook_price NUMERIC(10,2),
  facebook_link TEXT,
  facebook_location TEXT,
  mercari_price NUMERIC(10,2),
  mercari_link TEXT,
  
  -- Other retailers (JSON storage)
  other_retailers_data JSONB DEFAULT '[]',
  
  -- Market analysis data
  average_market_price NUMERIC(10,2),
  price_range_min NUMERIC(10,2),
  price_range_max NUMERIC(10,2),
  trending_score INTEGER CHECK (trending_score >= 0 AND trending_score <= 100),
  seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
  competitor_count INTEGER DEFAULT 0,
  market_demand TEXT CHECK (market_demand IN ('high', 'medium', 'low')),
  ai_confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (ai_confidence >= 0.00 AND ai_confidence <= 1.00),
  
  -- Market position analysis
  market_position TEXT CHECK (market_position IN ('premium', 'competitive', 'budget', 'unknown')),
  price_competitiveness_score INTEGER CHECK (price_competitiveness_score >= 0 AND price_competitiveness_score <= 100),
  
  -- Product specification data
  brand TEXT,
  category TEXT,
  year TEXT,
  weight TEXT,
  dimensions TEXT,
  
  -- Metadata arrays
  search_keywords TEXT[] DEFAULT '{}',
  recommended_categories TEXT[] DEFAULT '{}',
  best_selling_platforms TEXT[] DEFAULT '{}',
  product_variations JSONB DEFAULT '[]'::jsonb,
  marketplace_urls JSONB DEFAULT '{}'::jsonb,
  
  -- URL status tracking
  amazon_url_status TEXT DEFAULT 'unknown' CHECK (amazon_url_status IN ('active', 'expired', 'unavailable', 'unknown')),
  ebay_url_status TEXT DEFAULT 'unknown' CHECK (ebay_url_status IN ('active', 'expired', 'unavailable', 'unknown')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one market research record per product
  UNIQUE(product_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for competitive pricing queries
CREATE INDEX IF NOT EXISTS idx_market_research_msrp ON market_research_data(msrp) WHERE msrp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_amazon_price ON market_research_data(amazon_price) WHERE amazon_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_ebay_price ON market_research_data(ebay_price) WHERE ebay_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_competitive_price ON market_research_data(competitive_price) WHERE competitive_price IS NOT NULL;

-- JSONB indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_market_research_other_retailers ON market_research_data USING GIN(other_retailers_data);
CREATE INDEX IF NOT EXISTS idx_market_research_product_variations ON market_research_data USING GIN(product_variations);
CREATE INDEX IF NOT EXISTS idx_market_research_marketplace_urls ON market_research_data USING GIN(marketplace_urls);

-- Brand and category indexes
CREATE INDEX IF NOT EXISTS idx_market_research_brand ON market_research_data(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_category ON market_research_data(category) WHERE category IS NOT NULL;

-- Market analysis indexes
CREATE INDEX IF NOT EXISTS idx_market_research_market_demand ON market_research_data(market_demand);
CREATE INDEX IF NOT EXISTS idx_market_research_updated_at ON market_research_data(updated_at DESC);

-- Product ID index (for joins)
CREATE INDEX IF NOT EXISTS idx_market_research_product_id ON market_research_data(product_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on the table
ALTER TABLE market_research_data ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own product market research data
CREATE POLICY market_research_data_user_policy ON market_research_data
  USING (product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  ));

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE market_research_data IS 'Comprehensive market research data for competitive pricing analysis';
COMMENT ON COLUMN market_research_data.msrp IS 'Manufacturer Suggested Retail Price - critical for pricing strategy';
COMMENT ON COLUMN market_research_data.amazon_prime_available IS 'Whether product is available with Amazon Prime shipping';
COMMENT ON COLUMN market_research_data.amazon_seller_type IS 'Type of Amazon seller (Amazon, third-party, etc.)';
COMMENT ON COLUMN market_research_data.amazon_rating IS 'Product rating on Amazon (1-5 stars)';
COMMENT ON COLUMN market_research_data.amazon_review_count IS 'Number of reviews on Amazon';
COMMENT ON COLUMN market_research_data.ebay_new_price_min IS 'Minimum price for new items on eBay';
COMMENT ON COLUMN market_research_data.ebay_new_price_max IS 'Maximum price for new items on eBay';
COMMENT ON COLUMN market_research_data.ebay_used_price_min IS 'Minimum price for used items on eBay';
COMMENT ON COLUMN market_research_data.ebay_used_price_max IS 'Maximum price for used items on eBay';
COMMENT ON COLUMN market_research_data.ebay_recent_sold_average IS 'Recent average sold price on eBay';
COMMENT ON COLUMN market_research_data.other_retailers_data IS 'JSON array of other retailer pricing data';
COMMENT ON COLUMN market_research_data.competitive_price IS 'Recommended competitive price based on market analysis';
COMMENT ON COLUMN market_research_data.market_position IS 'Product position in market (premium, competitive, budget)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ market_research_data table created successfully!';
    RAISE NOTICE '📊 Table includes MSRP and all competitive pricing fields';
    RAISE NOTICE '🔒 Row Level Security (RLS) enabled with user-based access policy';
    RAISE NOTICE '⚡ Performance indexes created for pricing queries';
    RAISE NOTICE '📋 Run the fix_competitive_pricing_schema.sql migration next (it will be safe now)';
END $$; 