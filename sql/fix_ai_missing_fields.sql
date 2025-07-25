-- =====================================================
-- FIX AI MISSING FIELDS SCHEMA ISSUES
-- =====================================================
-- Add missing columns that AI code tries to insert into but don't exist

-- Add ai_missing_fields column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_missing_fields TEXT[] DEFAULT '{}';

-- Add confidence tracking fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_confidence_details JSONB DEFAULT '{}';

-- Add missing MSRP field to market_research_data table
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2);

-- Add missing comprehensive analysis fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upc TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS compliance_data JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS documentation_data JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS visual_content_needs JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';

-- Add pricing fields that AI tries to insert
ALTER TABLE products ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS competitive_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS amazon_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS amazon_link TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_ai_missing_fields ON products USING GIN(ai_missing_fields);
CREATE INDEX IF NOT EXISTS idx_products_ai_confidence_details ON products USING GIN(ai_confidence_details);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ AI missing fields schema migration completed!';
    RAISE NOTICE '📊 Added ai_missing_fields column to track AI gaps';
    RAISE NOTICE '💰 Added MSRP and pricing fields';
    RAISE NOTICE '📏 Added comprehensive analysis dimensions fields';
END $$; 