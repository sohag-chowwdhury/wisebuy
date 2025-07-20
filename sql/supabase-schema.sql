-- =====================================================
-- FLIP FORGE DATABASE SCHEMA
-- PostgreSQL + Supabase Real-time Pipeline System
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MAIN PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic product info
  name TEXT,
  model TEXT, -- Optional, can be filled later if AI confidence is low
  
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

-- =====================================================
-- 2. PIPELINE PHASES TABLE
-- =====================================================
CREATE TABLE pipeline_phases (
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
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Image storage (Supabase Storage URLs)
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Image metadata
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  image_order INTEGER DEFAULT 0,
  
  -- Image analysis
  is_primary BOOLEAN DEFAULT false,
  analysis_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PRODUCT ANALYSIS DATA (was PHASE 1 DATA)
-- =====================================================
CREATE TABLE product_analysis_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- AI Analysis Results
  product_name TEXT,
  model TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Condition Assessment
  item_condition TEXT CHECK (item_condition IN ('new', 'like-new', 'very-good', 'good', 'acceptable', 'poor')),
  condition_details TEXT,
  
  -- AI Detection Results
  detected_categories JSONB DEFAULT '[]'::jsonb,
  detected_brands JSONB DEFAULT '[]'::jsonb,
  color_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Quality checks
  image_quality_score INTEGER CHECK (image_quality_score >= 0 AND image_quality_score <= 100),
  completeness_score INTEGER CHECK (completeness_score >= 0 AND completeness_score <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id)
);

-- =====================================================
-- 5. MARKET RESEARCH DATA (was PHASE 2 DATA)
-- =====================================================
CREATE TABLE market_research_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Market Research
  amazon_price DECIMAL(10,2),
  amazon_link TEXT,
  msrp DECIMAL(10,2),
  competitive_price DECIMAL(10,2),
  
  -- Market Analysis
  price_trend JSONB DEFAULT '{}'::jsonb,
  market_demand_score INTEGER CHECK (market_demand_score >= 0 AND market_demand_score <= 100),
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  
  -- Product Specifications
  brand TEXT,
  category TEXT,
  year TEXT,
  weight TEXT,
  dimensions TEXT,
  
  -- Additional specs (flexible JSON)
  technical_specs JSONB DEFAULT '{}'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Research metadata
  research_sources JSONB DEFAULT '[]'::jsonb,
  last_price_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id)
);

-- =====================================================
-- 6. SEO ANALYSIS DATA (was PHASE 3 DATA)
-- =====================================================
CREATE TABLE seo_analysis_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- SEO Content
  seo_title TEXT,
  url_slug TEXT,
  meta_description TEXT,
  
  -- Keywords and Tags
  keywords JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- SEO Analysis
  keyword_difficulty JSONB DEFAULT '{}'::jsonb,
  search_volume JSONB DEFAULT '{}'::jsonb,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  
  -- Content optimization
  content_suggestions JSONB DEFAULT '[]'::jsonb,
  competitor_analysis JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id)
);

-- =====================================================
-- 7. PRODUCT LISTING DATA (was PHASE 4 DATA)
-- =====================================================
CREATE TABLE product_listing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Listing Content
  product_title TEXT,
  price DECIMAL(10,2),
  product_description TEXT,
  
  -- Inherited from previous phases
  brand TEXT,
  category TEXT,
  item_condition TEXT,
  
  -- Features and highlights
  key_features JSONB DEFAULT '[]'::jsonb,
  selling_points JSONB DEFAULT '[]'::jsonb,
  
  -- Publishing configuration
  publishing_status TEXT DEFAULT 'draft' CHECK (publishing_status IN ('draft', 'ready', 'published', 'archived')),
  channels JSONB DEFAULT '{"wordpress": false, "facebook": false, "ebay": false, "amazon": false}'::jsonb,
  
  -- Publishing results
  published_urls JSONB DEFAULT '{}'::jsonb,
  publishing_errors JSONB DEFAULT '{}'::jsonb,
  last_published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id)
);

-- =====================================================
-- 8. PIPELINE LOGS TABLE (for debugging & monitoring)
-- =====================================================
CREATE TABLE pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  phase_number INTEGER,
  
  -- Log details
  log_level TEXT CHECK (log_level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  action TEXT, -- 'start_phase', 'complete_phase', 'error', etc.
  user_triggered BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_pipeline_running ON products(is_pipeline_running) WHERE is_pipeline_running = true;

-- Pipeline phases indexes
CREATE INDEX idx_pipeline_phases_product_id ON pipeline_phases(product_id);
CREATE INDEX idx_pipeline_phases_status ON pipeline_phases(status);
CREATE INDEX idx_pipeline_phases_phase_number ON pipeline_phases(phase_number);
CREATE INDEX idx_pipeline_phases_running ON pipeline_phases(status, product_id) WHERE status = 'running';

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Phase data indexes
CREATE INDEX idx_product_analysis_data_product_id ON product_analysis_data(product_id);
CREATE INDEX idx_market_research_data_product_id ON market_research_data(product_id);
CREATE INDEX idx_seo_analysis_data_product_id ON seo_analysis_data(product_id);
CREATE INDEX idx_product_listing_data_product_id ON product_listing_data(product_id);

-- Logs indexes
CREATE INDEX idx_pipeline_logs_product_id ON pipeline_logs(product_id);
CREATE INDEX idx_pipeline_logs_created_at ON pipeline_logs(created_at DESC);
CREATE INDEX idx_pipeline_logs_level ON pipeline_logs(log_level);

-- =====================================================
-- 10. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_phases_updated_at BEFORE UPDATE ON pipeline_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_analysis_data_updated_at BEFORE UPDATE ON product_analysis_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_research_data_updated_at BEFORE UPDATE ON market_research_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_analysis_data_updated_at BEFORE UPDATE ON seo_analysis_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_listing_data_updated_at BEFORE UPDATE ON product_listing_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analysis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analysis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Pipeline phases policies (inherit from products)
CREATE POLICY "Users can view own pipeline phases" ON pipeline_phases FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = pipeline_phases.product_id AND products.user_id = auth.uid())
);
CREATE POLICY "Users can modify own pipeline phases" ON pipeline_phases FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = pipeline_phases.product_id AND products.user_id = auth.uid())
);

-- Apply similar policies to all phase data tables
CREATE POLICY "Users can access own product images" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.user_id = auth.uid())
);

CREATE POLICY "Users can access own product analysis data" ON product_analysis_data FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_analysis_data.product_id AND products.user_id = auth.uid())
);

CREATE POLICY "Users can access own market research data" ON market_research_data FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = market_research_data.product_id AND products.user_id = auth.uid())
);

CREATE POLICY "Users can access own seo analysis data" ON seo_analysis_data FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = seo_analysis_data.product_id AND products.user_id = auth.uid())
);

CREATE POLICY "Users can access own product listing data" ON product_listing_data FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_listing_data.product_id AND products.user_id = auth.uid())
);

CREATE POLICY "Users can access own pipeline logs" ON pipeline_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = pipeline_logs.product_id AND products.user_id = auth.uid())
);

-- =====================================================
-- 12. INITIALIZE PIPELINE PHASES FUNCTION
-- =====================================================

-- Function to initialize all 4 phases when a product is created
CREATE OR REPLACE FUNCTION initialize_pipeline_phases(p_product_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert all 4 phases
  INSERT INTO pipeline_phases (product_id, phase_number, phase_name, can_start) VALUES
    (p_product_id, 1, 'Product Analysis', true),
    (p_product_id, 2, 'Market Research', false),
    (p_product_id, 3, 'SEO Analysis', false),
    (p_product_id, 4, 'Product Listing', false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically initialize phases when product is created
CREATE OR REPLACE FUNCTION trigger_initialize_pipeline_phases()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_pipeline_phases(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_phases_on_product_creation
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_pipeline_phases();

-- =====================================================
-- 13. HELPER FUNCTIONS FOR PIPELINE MANAGEMENT
-- =====================================================

-- Function to start a phase
CREATE OR REPLACE FUNCTION start_phase(p_product_id UUID, p_phase_number INTEGER)
RETURNS boolean AS $$
DECLARE
  phase_record RECORD;
BEGIN
  -- Get phase record
  SELECT * INTO phase_record 
  FROM pipeline_phases 
  WHERE product_id = p_product_id AND phase_number = p_phase_number;
  
  -- Check if phase can be started
  IF NOT phase_record.can_start THEN
    RETURN false;
  END IF;
  
  -- Update phase status
  UPDATE pipeline_phases 
  SET 
    status = 'running',
    started_at = NOW(),
    progress_percentage = 0
  WHERE product_id = p_product_id AND phase_number = p_phase_number;
  
  -- Update product status
  UPDATE products 
  SET 
    is_pipeline_running = true,
    current_phase = p_phase_number,
    status = 'processing'
  WHERE id = p_product_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a phase
CREATE OR REPLACE FUNCTION complete_phase(p_product_id UUID, p_phase_number INTEGER)
RETURNS void AS $$
BEGIN
  -- Update phase status
  UPDATE pipeline_phases 
  SET 
    status = 'completed',
    completed_at = NOW(),
    progress_percentage = 100
  WHERE product_id = p_product_id AND phase_number = p_phase_number;
  
  -- Enable next phase if exists
  UPDATE pipeline_phases 
  SET can_start = true 
  WHERE product_id = p_product_id AND phase_number = p_phase_number + 1;
  
  -- If this is the last phase, mark product as completed
  IF p_phase_number = 4 THEN
    UPDATE products 
    SET 
      status = 'completed',
      is_pipeline_running = false
    WHERE id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. REAL-TIME SUBSCRIPTION SETUP
-- =====================================================

-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_phases;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_logs;

-- =====================================================
-- 15. STORAGE SETUP
-- =====================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Create storage policy for authenticated users
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