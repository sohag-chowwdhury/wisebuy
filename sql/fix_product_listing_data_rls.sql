-- Fix missing RLS policies for product_listing_data table
-- This should resolve the 500 error when updating product listing data

-- Enable RLS on product_listing_data table
ALTER TABLE product_listing_data ENABLE ROW LEVEL SECURITY;

-- Product listing data policies
CREATE POLICY "Users can view own product listing data" ON product_listing_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listing_data.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own product listing data" ON product_listing_data
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listing_data.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own product listing data" ON product_listing_data
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listing_data.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own product listing data" ON product_listing_data
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_listing_data.product_id 
    AND products.user_id = auth.uid()
  )
); 