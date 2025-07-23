-- Add eBay columns to market_research_data table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_price DECIMAL(10,2);
ALTER TABLE market_research_data ADD COLUMN IF NOT EXISTS ebay_link TEXT; 