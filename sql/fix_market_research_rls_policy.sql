-- =====================================================
-- FIX MARKET RESEARCH DATA RLS POLICIES
-- =====================================================
-- The market_research_data table has RLS enabled but missing INSERT policy
-- This prevents any data insertion

-- Add missing INSERT policy for market_research_data table
CREATE POLICY "Users can insert own market research data" ON market_research_data
FOR INSERT WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

-- Add missing UPDATE policy for market_research_data table  
CREATE POLICY "Users can update own market research data" ON market_research_data
FOR UPDATE USING (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

-- Add missing DELETE policy for market_research_data table
CREATE POLICY "Users can delete own market research data" ON market_research_data
FOR DELETE USING (
  product_id IN (
    SELECT id FROM products WHERE user_id = auth.uid()
  )
);

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE market_research_data ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Market research data RLS policies fixed!';
    RAISE NOTICE '📝 Added INSERT, UPDATE, and DELETE policies';
    RAISE NOTICE '🔓 Data insertion should now work properly';
END $$; 