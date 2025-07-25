-- =====================================================
-- HELPER SCRIPT: Extract Weight from Dimensions JSON
-- Run this AFTER the main schema extension to migrate existing data
-- =====================================================

-- Update products table: extract weight from dimensions JSON to separate weight_lbs field
UPDATE products 
SET weight_lbs = CASE 
  WHEN dimensions->>'weight' LIKE '%lbs%' THEN 
    CAST(REGEXP_REPLACE(dimensions->>'weight', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
  WHEN dimensions->>'weight_lbs' IS NOT NULL THEN
    CAST(dimensions->>'weight_lbs' AS DECIMAL(10,2))
  ELSE NULL
END
WHERE dimensions IS NOT NULL 
  AND (dimensions->>'weight' IS NOT NULL OR dimensions->>'weight_lbs' IS NOT NULL)
  AND weight_lbs IS NULL;

-- Update products table: extract dimensions from JSON to separate fields
UPDATE products 
SET 
  width_inches = CASE 
    WHEN dimensions->>'width_inches' IS NOT NULL THEN 
      CAST(dimensions->>'width_inches' AS DECIMAL(10,2))
    WHEN dimensions->>'width' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'width', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END,
  height_inches = CASE 
    WHEN dimensions->>'height_inches' IS NOT NULL THEN 
      CAST(dimensions->>'height_inches' AS DECIMAL(10,2))
    WHEN dimensions->>'height' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'height', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END,
  depth_inches = CASE 
    WHEN dimensions->>'depth_inches' IS NOT NULL THEN 
      CAST(dimensions->>'depth_inches' AS DECIMAL(10,2))
    WHEN dimensions->>'length' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'length', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END
WHERE dimensions IS NOT NULL 
  AND (width_inches IS NULL OR height_inches IS NULL OR depth_inches IS NULL);

-- Update market_research_data table: extract weight from dimensions
UPDATE product_market_data 
SET weight = CASE 
  WHEN dimensions LIKE '%lbs%' AND weight IS NULL THEN
    REGEXP_REPLACE(dimensions, '.*?([0-9.]+)\s*lbs.*', '\1 lbs', 'i')
  ELSE weight
END
WHERE dimensions IS NOT NULL 
  AND dimensions LIKE '%lbs%'
  AND (weight IS NULL OR weight = 'Unknown');

-- Example queries to verify the migration
/*
-- Check products with extracted weights
SELECT id, name, dimensions, weight_lbs, width_inches, height_inches, depth_inches
FROM products 
WHERE weight_lbs IS NOT NULL OR width_inches IS NOT NULL
LIMIT 10;

-- Check market research data with extracted weights  
SELECT product_id, dimensions, weight
FROM product_market_data
WHERE weight IS NOT NULL AND weight != 'Unknown'
LIMIT 10;
*/ 