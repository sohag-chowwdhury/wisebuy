-- Add WooCommerce category ID field to products table
-- This allows storing the selected WooCommerce category for publishing

ALTER TABLE products ADD COLUMN IF NOT EXISTS woocommerce_category_id INTEGER;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_category_id ON products(woocommerce_category_id);

-- Add comment to explain the field
COMMENT ON COLUMN products.woocommerce_category_id IS 'WooCommerce category ID selected by AI for product publishing'; 