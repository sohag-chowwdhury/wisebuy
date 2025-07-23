-- =====================================================
-- COMPLETE FLIP FORGE DATABASE SCHEMA
-- PostgreSQL + Supabase Real-time Pipeline System
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MAIN PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic product info (existing fields)
  name TEXT,
  model TEXT,
  
  -- Overall pipeline status
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error', 'paused')),
  ai_confidence INTEGER DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  
  -- Pipeline control
  is_pipeline_running BOOLEAN DEFAULT false,
  current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 4),
  
  -- Error handling
  error_message TEXT,
  requires_manual_review BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing products table (safe to run multiple times)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS year_released TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS key_features TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_variations TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS url_slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Add missing columns to existing seo_analysis_data table (safe to run multiple times)
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100);
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS search_volume INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS keyword_difficulty INTEGER DEFAULT 0 CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100);
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS content_suggestions TEXT[] DEFAULT '{}';
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS competitor_analysis JSONB DEFAULT '{}';
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS title_length INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS description_length INTEGER DEFAULT 0;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS keyword_density DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE seo_analysis_data ADD COLUMN IF NOT EXISTS readability_score INTEGER DEFAULT 0;

-- Add Amazon/eBay URL and competitive pricing columns to existing product_market_data table
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_price DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_url TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_verified BOOLEAN DEFAULT false;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_confidence DECIMAL(3,2) DEFAULT 0.00;

ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_price DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_url TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_verified BOOLEAN DEFAULT false;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_last_checked TIMESTAMP WITH TIME ZONE;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_confidence DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_seller_rating DECIMAL(3,2);

-- Additional platform data (Facebook Marketplace, Mercari, etc.)
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS facebook_price DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS mercari_price DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS mercari_url TEXT;

-- Platform URL status and metadata
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS url_status_amazon TEXT DEFAULT 'unknown' CHECK (url_status_amazon IN ('active', 'expired', 'unavailable', 'unknown'));
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS url_status_ebay TEXT DEFAULT 'unknown' CHECK (url_status_ebay IN ('active', 'expired', 'unavailable', 'unknown'));
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS url_status_facebook TEXT DEFAULT 'unknown' CHECK (url_status_facebook IN ('active', 'expired', 'unavailable', 'unknown'));
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS url_status_mercari TEXT DEFAULT 'unknown' CHECK (url_status_mercari IN ('active', 'expired', 'unavailable', 'unknown'));

-- =====================================================
-- 2. PIPELINE PHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Phase identification
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_name TEXT NOT NULL,
  
  -- Phase status and control
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'stopped')),
  can_start BOOLEAN DEFAULT false,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  processing_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique phase per product
  UNIQUE(product_id, phase_number)
);

-- =====================================================
-- 3. PRODUCT IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Image storage info
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  
  -- File metadata
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Image analysis
  width INTEGER,
  height INTEGER,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PRODUCT ANALYSIS DATA TABLE (Phase 1 Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_analysis_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Core product identification
  product_name TEXT,
  model TEXT,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Condition assessment
  item_condition TEXT CHECK (item_condition IN ('excellent', 'very_good', 'good', 'fair', 'poor', 'for_parts')),
  condition_details TEXT,
  
  -- AI Detection results
  detected_categories TEXT[] DEFAULT '{}',
  detected_brands TEXT[] DEFAULT '{}',
  
  -- Visual analysis
  color_analysis JSONB DEFAULT '{}',
  image_quality_score INTEGER DEFAULT 0 CHECK (image_quality_score >= 0 AND image_quality_score <= 100),
  completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one analysis per product
  UNIQUE(product_id)
);

-- =====================================================
-- 5. PRODUCT MARKET DATA TABLE (Phase 2 Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Pricing data
  average_market_price DECIMAL(10,2),
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  
  -- Market analysis
  market_demand TEXT CHECK (market_demand IN ('high', 'medium', 'low')),
  competitor_count INTEGER DEFAULT 0,
  trending_score INTEGER DEFAULT 0 CHECK (trending_score >= 0 AND trending_score <= 100),
  seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
  
  -- Market insights
  best_selling_platforms TEXT[] DEFAULT '{}',
  recommended_categories TEXT[] DEFAULT '{}',
  
  -- Research metadata
  data_sources TEXT[] DEFAULT '{}',
  research_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one market analysis per product
  UNIQUE(product_id)
);

-- =====================================================
-- 6. SEO ANALYSIS DATA TABLE (Phase 4 Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_analysis_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- SEO content
  seo_title TEXT,
  meta_description TEXT,
  url_slug TEXT,
  
  -- Keywords and tags
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- SEO analytics and scoring
  seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  search_volume INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0 CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100),
  
  -- Content analysis
  content_suggestions TEXT[] DEFAULT '{}',
  competitor_analysis JSONB DEFAULT '{}',
  
  -- Advanced SEO metrics
  title_length INTEGER DEFAULT 0,
  description_length INTEGER DEFAULT 0,
  keyword_density DECIMAL(5,2) DEFAULT 0.00,
  readability_score INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one SEO analysis per product
  UNIQUE(product_id)
);

-- =====================================================
-- 7. PRODUCT LISTING DATA TABLE (Phase 3 Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_listing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Listing content
  product_title TEXT,
  product_description TEXT,
  key_features TEXT[] DEFAULT '{}',
  
  -- Product details
  price DECIMAL(10,2),
  brand TEXT,
  category TEXT,
  item_condition TEXT,
  
  -- Publishing
  publishing_status TEXT DEFAULT 'draft' CHECK (publishing_status IN ('draft', 'ready', 'published', 'failed')),
  channels JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one listing data per product
  UNIQUE(product_id)
);

-- =====================================================
-- 8. PRODUCT LISTINGS TABLE (Platform-specific listings)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Platform info
  platform TEXT NOT NULL,
  
  -- Listing content
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  handling_days INTEGER DEFAULT 3,
  
  -- Listing status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed', 'paused')),
  external_listing_id TEXT,
  published_url TEXT,
  
  -- Performance tracking
  views INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. PRODUCT MONITORING TABLE (Phase 4 Results)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Monitoring settings
  monitoring_enabled BOOLEAN DEFAULT true,
  check_frequency_hours INTEGER DEFAULT 24,
  
  -- Alert settings
  price_alerts_enabled BOOLEAN DEFAULT true,
  competitor_tracking_enabled BOOLEAN DEFAULT true,
  performance_tracking_enabled BOOLEAN DEFAULT true,
  
  -- Monitoring data
  last_check_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  
  -- Alert thresholds
  price_drop_threshold_percent DECIMAL(5,2) DEFAULT 10.0,
  performance_alert_threshold INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one monitoring config per product
  UNIQUE(product_id)
);

-- =====================================================
-- 10. PIPELINE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Log details
  phase_number INTEGER CHECK (phase_number >= 0 AND phase_number <= 4), -- 0 for system-wide events
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  action TEXT,
  
  -- Additional context
  details JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_pipeline_running ON products(is_pipeline_running) WHERE is_pipeline_running = true;

-- Pipeline phases indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_phases_product_id ON pipeline_phases(product_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_phases_status ON pipeline_phases(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_phases_phase_number ON pipeline_phases(phase_number);
CREATE INDEX IF NOT EXISTS idx_pipeline_phases_can_start ON pipeline_phases(can_start) WHERE can_start = true;

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary) WHERE is_primary = true;

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_product_listings_product_id ON product_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_platform ON product_listings(platform);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(status);

-- Logs indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_product_id ON pipeline_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_created_at ON pipeline_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_level ON pipeline_logs(log_level);

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analysis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view own products" ON products
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
FOR DELETE USING (auth.uid() = user_id);

-- Pipeline phases policies
CREATE POLICY "Users can view own pipeline phases" ON pipeline_phases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pipeline_phases.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own pipeline phases" ON pipeline_phases
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pipeline_phases.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Product images policies
CREATE POLICY "Users can view own product images" ON product_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_images.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own product images" ON product_images
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_images.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Analysis data policies
CREATE POLICY "Users can view own analysis data" ON product_analysis_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_analysis_data.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Market data policies
CREATE POLICY "Users can view own market data" ON product_market_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_market_data.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Listings policies
CREATE POLICY "Users can view own listings" ON product_listings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listings.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own listings" ON product_listings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listings.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Monitoring policies
CREATE POLICY "Users can view own monitoring" ON product_monitoring
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_monitoring.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Logs policies
CREATE POLICY "Users can view own logs" ON pipeline_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pipeline_logs.product_id 
    AND products.user_id = auth.uid()
  )
);

-- =====================================================
-- 13. DATABASE FUNCTIONS
-- =====================================================

-- Function to start a phase
CREATE OR REPLACE FUNCTION start_phase(p_product_id UUID, p_phase_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the phase to running
  UPDATE pipeline_phases 
  SET 
    status = 'running',
    started_at = NOW(),
    progress_percentage = 0,
    updated_at = NOW()
  WHERE 
    product_id = p_product_id 
    AND phase_number = p_phase_number
    AND can_start = true;
  
  -- Update product status
  UPDATE products 
  SET 
    is_pipeline_running = true,
    current_phase = p_phase_number,
    status = 'processing',
    updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN FOUND;
END;
$$;

-- Function to complete a phase
CREATE OR REPLACE FUNCTION complete_phase(p_product_id UUID, p_phase_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Complete current phase
  UPDATE pipeline_phases 
  SET 
    status = 'completed',
    completed_at = NOW(),
    progress_percentage = 100,
    processing_time_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    updated_at = NOW()
  WHERE 
    product_id = p_product_id 
    AND phase_number = p_phase_number;
  
  -- Enable next phase if it exists
  IF p_phase_number < 4 THEN
    UPDATE pipeline_phases 
    SET 
      can_start = true,
      updated_at = NOW()
    WHERE 
      product_id = p_product_id 
      AND phase_number = p_phase_number + 1;
      
    -- Update product current phase
    UPDATE products 
    SET 
      current_phase = p_phase_number + 1,
      updated_at = NOW()
    WHERE id = p_product_id;
  ELSE
    -- All phases complete
    UPDATE products 
    SET 
      status = 'completed',
      is_pipeline_running = false,
      updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_phases_updated_at BEFORE UPDATE ON pipeline_phases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_analysis_data_updated_at BEFORE UPDATE ON product_analysis_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_market_data_updated_at BEFORE UPDATE ON product_market_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_listings_updated_at BEFORE UPDATE ON product_listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_monitoring_updated_at BEFORE UPDATE ON product_monitoring
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. REAL-TIME SUBSCRIPTION SETUP
-- =====================================================

-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_phases;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE product_listings;

-- =====================================================
-- 15. STORAGE SETUP
-- =====================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 16. INITIAL DATA
-- =====================================================

-- Insert phase templates (for reference)
-- This helps ensure consistent phase naming across the application

-- Note: Actual phase records are created per product
-- This is just for documentation/reference

COMMENT ON TABLE products IS 'Main products table storing basic product information and pipeline status';
COMMENT ON TABLE pipeline_phases IS 'Individual pipeline phases for each product with progress tracking';
COMMENT ON TABLE product_images IS 'Product images with storage metadata';
COMMENT ON TABLE product_analysis_data IS 'Phase 1: AI analysis results including product identification and condition';
COMMENT ON TABLE product_market_data IS 'Phase 2: Market research and pricing analysis results';
COMMENT ON TABLE product_listings IS 'Phase 3: Generated listings for different platforms';
COMMENT ON TABLE product_monitoring IS 'Phase 4: Monitoring configuration and alert settings';
COMMENT ON TABLE pipeline_logs IS 'Comprehensive logging for all pipeline activities';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 'Database schema setup completed successfully!' as status;