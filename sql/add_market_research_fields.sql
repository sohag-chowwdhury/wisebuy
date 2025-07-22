-- =====================================================
-- ADD BRAND, YEAR, WEIGHT, AND DIMENSIONS TO MARKET RESEARCH DATA
-- =====================================================

-- Add brand, year, weight, and dimensions to product_market_data table
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS weight TEXT; -- e.g., "2.5 lbs" or "1.2 kg"
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS dimensions TEXT; -- e.g., "12 x 8 x 6 inches"

-- Add additional useful product specification fields
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS model_number TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS material TEXT;

-- Add structured dimensions as JSONB for more detailed storage
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS dimensions_structured JSONB DEFAULT '{}';
-- Example: {"length": "12 inches", "width": "8 inches", "height": "6 inches", "unit": "inches"}

-- Add weight as structured data too
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS weight_structured JSONB DEFAULT '{}';
-- Example: {"value": 2.5, "unit": "lbs", "display": "2.5 lbs"}

-- Add product specifications as JSONB for extensibility
ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
-- Example: {"power": "120V", "capacity": "12 cups", "features": ["programmable", "auto-shutoff"]}

-- Create index for searching by brand and year
CREATE INDEX IF NOT EXISTS idx_product_market_data_brand ON product_market_data(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_market_data_year ON product_market_data(year) WHERE year IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN product_market_data.brand IS 'Product brand name (e.g., Samsung, Apple)';
COMMENT ON COLUMN product_market_data.year IS 'Product release/manufacture year';
COMMENT ON COLUMN product_market_data.weight IS 'Product weight as display string (e.g., 2.5 lbs)';
COMMENT ON COLUMN product_market_data.dimensions IS 'Product dimensions as display string (e.g., 12 x 8 x 6 inches)';
COMMENT ON COLUMN product_market_data.dimensions_structured IS 'Structured dimensions data in JSON format';
COMMENT ON COLUMN product_market_data.weight_structured IS 'Structured weight data in JSON format';
COMMENT ON COLUMN product_market_data.specifications IS 'Additional product specifications in JSON format';

-- Update existing records to populate brand from products table if available
UPDATE product_market_data 
SET brand = products.brand
FROM products 
WHERE product_market_data.product_id = products.id 
  AND products.brand IS NOT NULL 
  AND product_market_data.brand IS NULL;

-- Example data structure for dimensions_structured:
-- {
--   "length": {"value": 12, "unit": "inches"},
--   "width": {"value": 8, "unit": "inches"},
--   "height": {"value": 6, "unit": "inches"},
--   "display": "12 x 8 x 6 inches"
-- }

-- Example data structure for weight_structured:
-- {
--   "value": 2.5,
--   "unit": "lbs",
--   "display": "2.5 lbs",
--   "grams": 1134
-- }

-- Example data structure for specifications:
-- {
--   "power": "120V",
--   "capacity": "12 cups",
--   "material": "stainless steel",
--   "features": ["programmable", "auto-shutoff", "thermal carafe"],
--   "warranty": "2 years",
--   "energy_rating": "Energy Star"
-- } 