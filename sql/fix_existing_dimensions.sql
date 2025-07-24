-- =====================================================
-- FIX EXISTING DIMENSIONS - Extract values from JSON to individual fields
-- Run this to fix the current null dimension issue
-- =====================================================

-- Update products table: extract dimensions from JSON to individual numeric fields
UPDATE products 
SET 
  width_inches = CASE 
    -- Try to extract from width field with "inches" 
    WHEN dimensions->>'width' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'width', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    -- Try width_inches field directly
    WHEN dimensions->>'width_inches' IS NOT NULL THEN 
      CAST(dimensions->>'width_inches' AS DECIMAL(10,2))
    -- Try w field
    WHEN dimensions->>'w' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'w', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END,
  height_inches = CASE 
    -- Try to extract from height field with "inches"
    WHEN dimensions->>'height' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'height', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    -- Try height_inches field directly  
    WHEN dimensions->>'height_inches' IS NOT NULL THEN 
      CAST(dimensions->>'height_inches' AS DECIMAL(10,2))
    -- Try h field
    WHEN dimensions->>'h' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'h', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END,
  depth_inches = CASE 
    -- Try to extract from depth field
    WHEN dimensions->>'depth' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'depth', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    -- Try length field (sometimes used for depth)
    WHEN dimensions->>'length' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'length', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    -- Try depth_inches field directly
    WHEN dimensions->>'depth_inches' IS NOT NULL THEN 
      CAST(dimensions->>'depth_inches' AS DECIMAL(10,2))
    -- Try d field
    WHEN dimensions->>'d' LIKE '%inches%' THEN
      CAST(REGEXP_REPLACE(dimensions->>'d', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END,
  weight_lbs = CASE 
    -- Try to extract from weight field with "lbs" 
    WHEN dimensions->>'weight' LIKE '%lbs%' THEN 
      CAST(REGEXP_REPLACE(dimensions->>'weight', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    -- Try weight_lbs field directly
    WHEN dimensions->>'weight_lbs' IS NOT NULL THEN
      CAST(dimensions->>'weight_lbs' AS DECIMAL(10,2))
    -- Try to extract from weight field with "lb" (singular)
    WHEN dimensions->>'weight' LIKE '%lb%' THEN 
      CAST(REGEXP_REPLACE(dimensions->>'weight', '[^0-9.]', '', 'g') AS DECIMAL(10,2))
    ELSE NULL
  END
WHERE dimensions IS NOT NULL 
  AND (width_inches IS NULL OR height_inches IS NULL OR depth_inches IS NULL OR weight_lbs IS NULL);

-- Show results to verify the update worked
SELECT 
  id,
  name,
  model,
  dimensions,
  width_inches,
  height_inches, 
  depth_inches,
  weight_lbs
FROM products 
WHERE dimensions IS NOT NULL
LIMIT 10; 