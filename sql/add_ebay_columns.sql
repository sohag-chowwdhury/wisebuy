-- Add eBay and additional useful columns to market_research_data table
-- Run this in your Supabase SQL editor

-- Add eBay specific columns
ALTER TABLE public.market_research_data 
ADD COLUMN IF NOT EXISTS ebay_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ebay_link TEXT,
ADD COLUMN IF NOT EXISTS ebay_seller_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ebay_shipping_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ebay_condition TEXT,
ADD COLUMN IF NOT EXISTS ebay_listings_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ebay_sold_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ebay_last_updated TIMESTAMP WITH TIME ZONE;

-- Add Facebook Marketplace columns
ALTER TABLE public.market_research_data 
ADD COLUMN IF NOT EXISTS facebook_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS facebook_link TEXT,
ADD COLUMN IF NOT EXISTS facebook_location TEXT;

-- Add Mercari columns  
ALTER TABLE public.market_research_data 
ADD COLUMN IF NOT EXISTS mercari_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS mercari_link TEXT;

-- Add additional market analysis columns
ALTER TABLE public.market_research_data 
ADD COLUMN IF NOT EXISTS average_market_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_range_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_range_max NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS trending_score INTEGER CHECK (trending_score >= 0 AND trending_score <= 100),
ADD COLUMN IF NOT EXISTS seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS recommended_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS best_selling_platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS market_demand TEXT CHECK (market_demand IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (ai_confidence >= 0.00 AND ai_confidence <= 1.00),
ADD COLUMN IF NOT EXISTS search_keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS marketplace_urls JSONB DEFAULT '{}'::jsonb;

-- Add URL status tracking
ALTER TABLE public.market_research_data 
ADD COLUMN IF NOT EXISTS amazon_url_status TEXT DEFAULT 'unknown' CHECK (amazon_url_status IN ('active', 'expired', 'unavailable', 'unknown')),
ADD COLUMN IF NOT EXISTS ebay_url_status TEXT DEFAULT 'unknown' CHECK (ebay_url_status IN ('active', 'expired', 'unavailable', 'unknown')),
ADD COLUMN IF NOT EXISTS amazon_last_checked TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ebay_last_checked TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_research_data_amazon_price ON public.market_research_data(amazon_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_ebay_price ON public.market_research_data(ebay_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_average_price ON public.market_research_data(average_market_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_market_demand ON public.market_research_data(market_demand);
CREATE INDEX IF NOT EXISTS idx_market_research_data_updated_at ON public.market_research_data(updated_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN market_research_data.ebay_price IS 'Current eBay listing price';
COMMENT ON COLUMN market_research_data.ebay_link IS 'Direct eBay product URL';
COMMENT ON COLUMN market_research_data.ebay_seller_rating IS 'eBay seller rating (0.00-5.00)';
COMMENT ON COLUMN market_research_data.average_market_price IS 'Calculated average price across all platforms';
COMMENT ON COLUMN market_research_data.ai_confidence IS 'AI confidence score for the data accuracy (0.00-1.00)';
COMMENT ON COLUMN market_research_data.marketplace_urls IS 'JSON object containing URLs from various marketplaces';

SELECT 'Market research data table updated successfully with eBay and additional columns!' as status; 