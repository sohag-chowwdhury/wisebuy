-- Add year_released column to products table
-- This migration adds a year_released TEXT column to store the release year of products

ALTER TABLE products ADD COLUMN IF NOT EXISTS year_released TEXT;

-- Add comment to document the column
COMMENT ON COLUMN products.year_released IS 'Year the product was originally released (extracted by AI from specifications)';

-- Create index for better query performance on year filtering
CREATE INDEX IF NOT EXISTS idx_products_year_released ON products(year_released) WHERE year_released IS NOT NULL; 