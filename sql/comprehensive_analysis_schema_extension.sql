-- =====================================================
-- COMPREHENSIVE ANALYSIS - EXTEND EXISTING TABLES
-- Add comprehensive analysis fields to existing tables
-- =====================================================

-- =====================================================
-- 1. EXTEND PRODUCTS TABLE
-- =====================================================

-- Basic product identification fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS upc TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_description TEXT;

-- Physical specifications as separate fields for better UI
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS depth_inches DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL(10,2);

-- Technical details as JSONB (extend existing technical_specs JSONB)
-- The existing technical_specs JSONB column will store comprehensive technical data
-- Example: {
--   "power_requirements": {"voltage": "120V", "wattage": "60W", "bulb_type": "LED"},
--   "electrical_specs": {"cord_length": "6ft", "ul_listed": true, "etl_listed": false},
--   "assembly": {"tools_required": true, "assembly_time": "30 minutes", "difficulty": "easy"},
--   "materials": {"primary_material": "metal", "finish": "brushed nickel", "shade_material": "fabric"}
-- }

-- Compliance and safety information
ALTER TABLE products ADD COLUMN IF NOT EXISTS compliance_data JSONB DEFAULT '{}';
-- Example: {
--   "safety_certifications": ["UL", "ETL"],
--   "country_of_origin": "China",
--   "prop_65_warning": false,
--   "warranty_terms": "2 year limited warranty"
-- }

-- Documentation and resources
ALTER TABLE products ADD COLUMN IF NOT EXISTS documentation_data JSONB DEFAULT '{}';
-- Example: {
--   "official_product_page": "https://manufacturer.com/product",
--   "instruction_manual": "https://manual-url.com",
--   "additional_resources": [
--     {"url": "https://resource1.com", "description": "Installation guide"},
--     {"url": "https://resource2.com", "description": "Troubleshooting"}
--   ]
-- }

-- Visual content assessment
ALTER TABLE products ADD COLUMN IF NOT EXISTS visual_content_needs JSONB DEFAULT '{}';
-- Example: {
--   "lifestyle_shots_required": true,
--   "detail_shots_required": false,
--   "additional_photos_needed": ["installed view", "size comparison"]
-- }

-- Analysis metadata
ALTER TABLE products ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';
-- Example: {
--   "analysis_date": "2024-01-15T10:30:00Z",
--   "analyst_notes": "High quality packaging, all specifications clearly visible",
--   "data_confidence_level": "high",
--   "missing_information": ["warranty details", "energy rating"]
-- }

-- =====================================================
-- 2. EXTEND PRODUCT_MARKET_DATA TABLE  
-- =====================================================

-- Enhanced Amazon pricing data (extend existing amazon_price, amazon_url fields)
-- Note: We use existing amazon_url field, not amazon_link
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_prime_available BOOLEAN DEFAULT false;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_seller_type TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_rating DECIMAL(3,1);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_review_count INTEGER;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS amazon_search_results_url TEXT;

-- Enhanced eBay pricing data (extend existing ebay_price, ebay_url fields)  
-- Note: We use existing ebay_url field, not ebay_link
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_new_price_min DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_new_price_max DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_used_price_min DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_used_price_max DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_recent_sold_average DECIMAL(10,2);
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_search_results_url TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS ebay_sold_listings_url TEXT;

-- Other retailers pricing
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS other_retailers_data JSONB DEFAULT '{}';
-- Example: {
--   "home_depot": {"price": 89.99, "url": "https://homedepot.com/...", "availability": "in_stock"},
--   "lowes": {"price": 92.99, "url": "https://lowes.com/...", "availability": "limited"},
--   "walmart": {"price": 85.99, "url": "https://walmart.com/...", "availability": "online_only"},
--   "target": {"price": 88.99, "url": "https://target.com/...", "availability": "in_stock"}
-- }

-- Market analysis (extend existing market analysis capabilities)
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS target_demographics TEXT[] DEFAULT '{}';
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS seasonal_demand_pattern TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS complementary_products TEXT[] DEFAULT '{}';
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS key_selling_points TEXT[] DEFAULT '{}';

-- Logistics assessment
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS logistics_data JSONB DEFAULT '{}';
-- Example: {
--   "package_condition": "excellent",
--   "fragility_level": "medium",
--   "shipping_considerations": "Requires careful packaging due to glass components",
--   "storage_requirements": "Store in dry location",
--   "return_policy_implications": "Original packaging required for returns"
-- }

-- Pricing recommendations
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS pricing_recommendation JSONB DEFAULT '{}';
-- Example: {
--   "suggested_price_range": {"min": 75.00, "max": 95.00},
--   "justification": "Based on Amazon pricing and condition assessment",
--   "profit_margin_estimate": "30-40%",
--   "confidence_level": "high"
-- }

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer) WHERE manufacturer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc) WHERE upc IS NOT NULL;

-- Indexes for dimension fields
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight_lbs) WHERE weight_lbs IS NOT NULL;

-- JSONB indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_products_compliance_data ON products USING GIN(compliance_data);
CREATE INDEX IF NOT EXISTS idx_products_analysis_metadata ON products USING GIN(analysis_metadata);
CREATE INDEX IF NOT EXISTS idx_market_data_other_retailers ON product_market_data USING GIN(other_retailers_data);
CREATE INDEX IF NOT EXISTS idx_market_data_logistics ON product_market_data USING GIN(logistics_data);

-- =====================================================
-- 4. EXAMPLE USAGE QUERIES
-- =====================================================

-- Query comprehensive product data
/*
SELECT 
    p.id,
    p.name,
    p.brand,
    p.manufacturer,
    p.upc,
    p.width_inches,
    p.height_inches,
    p.depth_inches,
    p.weight_lbs,
    p.compliance_data,
    pmd.amazon_price,
    pmd.amazon_prime_available,
    pmd.ebay_recent_sold_average,
    pmd.other_retailers_data,
    pmd.pricing_recommendation
FROM products p
LEFT JOIN product_market_data pmd ON p.id = pmd.product_id
WHERE p.id = $1;
*/

-- Search by UPC
/*
SELECT * FROM products WHERE upc = $1;
*/

-- Find products with specific safety certifications
/*
SELECT * FROM products 
WHERE compliance_data->'safety_certifications' ? 'UL';
*/

-- Find products by weight range
/*
SELECT * FROM products 
WHERE weight_lbs BETWEEN $1 AND $2;
*/

-- Get pricing comparison data
/*
SELECT 
    p.name,
    p.weight_lbs,
    CONCAT(p.width_inches, '"W x ', p.height_inches, '"H x ', p.depth_inches, '"D') as dimensions,
    pmd.amazon_price,
    pmd.ebay_recent_sold_average,
    pmd.other_retailers_data->'home_depot'->>'price' as home_depot_price,
    pmd.pricing_recommendation->'suggested_price_range'->>'min' as suggested_min
FROM products p
JOIN product_market_data pmd ON p.id = pmd.product_id
WHERE p.brand = $1;
*/

-- =====================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN products.manufacturer IS 'Product manufacturer name extracted from packaging';
COMMENT ON COLUMN products.upc IS 'Universal Product Code from packaging barcode';
COMMENT ON COLUMN products.item_number IS 'Manufacturer item/model number from packaging';
COMMENT ON COLUMN products.width_inches IS 'Product width in inches';
COMMENT ON COLUMN products.height_inches IS 'Product height in inches';
COMMENT ON COLUMN products.depth_inches IS 'Product depth/length in inches';
COMMENT ON COLUMN products.weight_lbs IS 'Product weight in pounds';
COMMENT ON COLUMN products.compliance_data IS 'Safety certifications, country of origin, warranties (JSON)';
COMMENT ON COLUMN products.documentation_data IS 'Official product pages, manuals, resources (JSON)';
COMMENT ON COLUMN products.visual_content_needs IS 'Photography requirements assessment (JSON)';
COMMENT ON COLUMN products.analysis_metadata IS 'Analysis confidence, date, notes, missing info (JSON)';

COMMENT ON COLUMN product_market_data.amazon_prime_available IS 'Whether product is available with Amazon Prime';
COMMENT ON COLUMN product_market_data.amazon_seller_type IS 'Amazon seller type (Amazon, third-party, etc.)';
COMMENT ON COLUMN product_market_data.ebay_recent_sold_average IS 'Recent average sold price on eBay';
COMMENT ON COLUMN product_market_data.other_retailers_data IS 'Pricing data from Home Depot, Lowes, Walmart, Target (JSON)';
COMMENT ON COLUMN product_market_data.target_demographics IS 'Identified target customer demographics';
COMMENT ON COLUMN product_market_data.complementary_products IS 'Products that complement this item';
COMMENT ON COLUMN product_market_data.logistics_data IS 'Shipping, storage, return considerations (JSON)';
COMMENT ON COLUMN product_market_data.pricing_recommendation IS 'AI-suggested pricing with justification (JSON)'; 