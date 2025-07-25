-- =====================================================
-- FIX COMPETITIVE PRICING SCHEMA - ADD MISSING FIELDS
-- =====================================================
-- This migration adds all missing fields for comprehensive competitive pricing storage
-- including MSRP and enhanced Amazon/eBay data to match the JSON structure
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. ADD MISSING MSRP FIELD (CRITICAL)
-- =====================================================

-- Add MSRP to market_research_data table
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2);

-- Add MSRP to product_market_data table (if it exists)
-- This handles the table naming inconsistency in the codebase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_market_data') THEN
        ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2);
    END IF;
END $$;

-- =====================================================
-- 2. ENSURE ALL AMAZON COMPETITIVE PRICING FIELDS EXIST
-- =====================================================

-- Basic Amazon fields
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_url TEXT;

-- Enhanced Amazon fields to match competitive_pricing.amazon structure
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_prime_available BOOLEAN DEFAULT NULL;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_seller_type TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_rating DECIMAL(3,1);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_review_count INTEGER;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_search_results_url TEXT;

-- Amazon metadata fields
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_verified BOOLEAN DEFAULT false;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS amazon_confidence DECIMAL(3,2) DEFAULT 0.00;

-- =====================================================
-- 3. ENSURE ALL EBAY COMPETITIVE PRICING FIELDS EXIST
-- =====================================================

-- Basic eBay fields
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_url TEXT;

-- Enhanced eBay fields to match competitive_pricing.ebay structure
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_new_price_min DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_new_price_max DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_used_price_min DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_used_price_max DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_recent_sold_average DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_search_results_url TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_sold_listings_url TEXT;

-- eBay metadata fields
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_verified BOOLEAN DEFAULT false;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_confidence DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_seller_rating DECIMAL(3,2);

-- =====================================================
-- 4. OTHER RETAILERS DATA (JSON STORAGE)
-- =====================================================

-- Store other retailers data as JSONB to match competitive_pricing.other_retailers structure
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS other_retailers_data JSONB DEFAULT '[]';

-- Example structure for other_retailers_data:
-- [
--   {
--     "retailer": "Home Depot",
--     "price": 89.99,
--     "url": "https://homedepot.com/product",
--     "availability": "in_stock"
--   },
--   {
--     "retailer": "Walmart",
--     "price": 85.99,
--     "url": "https://walmart.com/product",
--     "availability": "online_only"
--   }
-- ]

-- =====================================================
-- 5. COMPETITIVE PRICING SUMMARY FIELDS
-- =====================================================

-- Add overall competitive pricing summary
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS competitive_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS lowest_competitor_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS highest_competitor_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS average_competitor_price DECIMAL(10,2);

-- Market position analysis
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS market_position TEXT CHECK (market_position IN ('premium', 'competitive', 'budget', 'unknown'));
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS price_competitiveness_score INTEGER CHECK (price_competitiveness_score >= 0 AND price_competitiveness_score <= 100);

-- =====================================================
-- 6. PRODUCT SPECIFICATION FIELDS
-- =====================================================

-- Fields that support competitive pricing analysis
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS dimensions TEXT;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for competitive pricing queries
CREATE INDEX IF NOT EXISTS idx_market_research_msrp ON market_research_data(msrp) WHERE msrp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_amazon_price ON market_research_data(amazon_price) WHERE amazon_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_ebay_price ON market_research_data(ebay_price) WHERE ebay_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_competitive_price ON market_research_data(competitive_price) WHERE competitive_price IS NOT NULL;

-- JSONB index for other retailers
CREATE INDEX IF NOT EXISTS idx_market_research_other_retailers ON market_research_data USING GIN(other_retailers_data);

-- Brand and category indexes
CREATE INDEX IF NOT EXISTS idx_market_research_brand ON market_research_data(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_category ON market_research_data(category) WHERE category IS NOT NULL;

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

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
-- 9. EXAMPLE QUERY TO VERIFY STRUCTURE
-- =====================================================

-- Query to see all competitive pricing data for a product
/*
SELECT 
    p.name as product_name,
    mrd.msrp,
    mrd.amazon_price,
    mrd.amazon_prime_available,
    mrd.amazon_rating,
    mrd.amazon_review_count,
    mrd.ebay_new_price_min,
    mrd.ebay_new_price_max,
    mrd.ebay_recent_sold_average,
    mrd.other_retailers_data,
    mrd.competitive_price,
    mrd.market_position
FROM products p
JOIN market_research_data mrd ON p.id = mrd.product_id
WHERE p.id = $1;
*/

-- =====================================================
-- 10. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Competitive pricing schema migration completed successfully!';
    RAISE NOTICE '📊 Added MSRP field and all Amazon/eBay competitive pricing fields';
    RAISE NOTICE '🏪 Added other retailers JSON storage';
    RAISE NOTICE '📈 Added competitive pricing analysis fields';
    RAISE NOTICE '⚡ Added performance indexes for pricing queries';
    RAISE NOTICE '📋 Run a test query to verify your competitive pricing data structure';
END $$; 