-- ========================================
-- COLUMNS TO ADD TO market_research_data
-- ========================================
-- Run this in your Supabase SQL editor

-- eBay specific columns
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_price NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_link TEXT;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_seller_rating DECIMAL(3,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_shipping_cost NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_condition TEXT;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_listings_count INTEGER DEFAULT 0;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_sold_count INTEGER DEFAULT 0;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_last_updated TIMESTAMP WITH TIME ZONE;

-- Additional marketplace columns
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS facebook_price NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS facebook_link TEXT;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS facebook_location TEXT;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS mercari_price NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS mercari_link TEXT;

-- Market analysis columns
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS average_market_price NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS price_range_min NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS price_range_max NUMERIC(10,2);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS trending_score INTEGER CHECK (trending_score >= 0 AND trending_score <= 100);
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS seasonal_factor DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS competitor_count INTEGER DEFAULT 0;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS market_demand TEXT CHECK (market_demand IN ('high', 'medium', 'low'));
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (ai_confidence >= 0.00 AND ai_confidence <= 1.00);

-- Array and JSON columns for metadata
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS search_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS recommended_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS best_selling_platforms TEXT[] DEFAULT '{}';
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS product_variations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS marketplace_urls JSONB DEFAULT '{}'::jsonb;

-- URL status tracking
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS amazon_url_status TEXT DEFAULT 'unknown' CHECK (amazon_url_status IN ('active', 'expired', 'unavailable', 'unknown'));
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_url_status TEXT DEFAULT 'unknown' CHECK (ebay_url_status IN ('active', 'expired', 'unavailable', 'unknown'));
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS amazon_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.market_research_data ADD COLUMN IF NOT EXISTS ebay_last_checked TIMESTAMP WITH TIME ZONE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_market_research_data_amazon_price ON public.market_research_data(amazon_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_ebay_price ON public.market_research_data(ebay_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_average_price ON public.market_research_data(average_market_price);
CREATE INDEX IF NOT EXISTS idx_market_research_data_market_demand ON public.market_research_data(market_demand);
CREATE INDEX IF NOT EXISTS idx_market_research_data_updated_at ON public.market_research_data(updated_at DESC); 