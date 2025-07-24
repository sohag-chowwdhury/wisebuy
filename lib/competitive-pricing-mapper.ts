// lib/competitive-pricing-mapper.ts
// Maps competitive pricing JSON structure to database fields

export interface CompetitivePricingData {
  amazon: {
    price: number | null;
    prime_available: boolean | null;
    seller_type: string;
    rating: number | null;
    review_count: number | null;
    url: string;
    search_results_url: string;
  };
  ebay: {
    new_price_range: {
      min: number | null;
      max: number | null;
    };
    used_price_range: {
      min: number | null;
      max: number | null;
    };
    recent_sold_average: number | null;
    search_results_url: string;
    sold_listings_url: string;
  };
  other_retailers: Array<{
    retailer: string;
    price: number | null;
    url: string;
    availability: string;
  }>;
}

export interface ProductPricingData {
  msrp: number | null;
  competitive_pricing: CompetitivePricingData;
}

/**
 * Maps competitive pricing JSON structure to market_research_data table fields
 */
export function mapCompetitivePricingToDatabase(
  productId: string,
  pricingData: ProductPricingData
): Partial<any> {
  const { msrp, competitive_pricing } = pricingData;
  
  return {
    product_id: productId,
    
    // =====================================================
    // MSRP - CRITICAL PRICING DATA
    // =====================================================
    msrp: msrp,
    
    // =====================================================
    // AMAZON PRICING DATA
    // =====================================================
    amazon_price: competitive_pricing.amazon.price,
    amazon_url: competitive_pricing.amazon.url || null,
    amazon_prime_available: competitive_pricing.amazon.prime_available,
    amazon_seller_type: competitive_pricing.amazon.seller_type || null,
    amazon_rating: competitive_pricing.amazon.rating,
    amazon_review_count: competitive_pricing.amazon.review_count,
    amazon_search_results_url: competitive_pricing.amazon.search_results_url || null,
    amazon_verified: competitive_pricing.amazon.price !== null,
    amazon_last_checked: new Date().toISOString(),
    amazon_confidence: competitive_pricing.amazon.price !== null ? 0.8 : 0.0,
    
    // =====================================================
    // EBAY PRICING DATA  
    // =====================================================
    ebay_price: competitive_pricing.ebay.recent_sold_average,
    ebay_url: competitive_pricing.ebay.sold_listings_url || null,
    ebay_new_price_min: competitive_pricing.ebay.new_price_range?.min,
    ebay_new_price_max: competitive_pricing.ebay.new_price_range?.max,
    ebay_used_price_min: competitive_pricing.ebay.used_price_range?.min,
    ebay_used_price_max: competitive_pricing.ebay.used_price_range?.max,
    ebay_recent_sold_average: competitive_pricing.ebay.recent_sold_average,
    ebay_search_results_url: competitive_pricing.ebay.search_results_url || null,
    ebay_sold_listings_url: competitive_pricing.ebay.sold_listings_url || null,
    ebay_verified: competitive_pricing.ebay.recent_sold_average !== null,
    ebay_last_checked: new Date().toISOString(),
    ebay_confidence: competitive_pricing.ebay.recent_sold_average !== null ? 0.7 : 0.0,
    
    // =====================================================
    // OTHER RETAILERS DATA (JSON STORAGE)
    // =====================================================
    other_retailers_data: competitive_pricing.other_retailers || [],
    
    // =====================================================
    // COMPETITIVE PRICING ANALYSIS
    // =====================================================
    competitive_price: calculateRecommendedPrice(pricingData),
    lowest_competitor_price: findLowestPrice(pricingData),
    highest_competitor_price: findHighestPrice(pricingData),
    average_competitor_price: calculateAveragePrice(pricingData),
    market_position: determineMarketPosition(pricingData),
    price_competitiveness_score: calculateCompetitivenessScore(pricingData),
    
    // Metadata
    updated_at: new Date().toISOString()
  };
}

/**
 * Calculate recommended competitive price based on all available data
 */
function calculateRecommendedPrice(pricingData: ProductPricingData): number | null {
  const prices: number[] = [];
  
  // Add Amazon price
  if (pricingData.competitive_pricing.amazon.price) {
    prices.push(pricingData.competitive_pricing.amazon.price);
  }
  
  // Add eBay average
  if (pricingData.competitive_pricing.ebay.recent_sold_average) {
    prices.push(pricingData.competitive_pricing.ebay.recent_sold_average);
  }
  
  // Add other retailer prices
  pricingData.competitive_pricing.other_retailers.forEach(retailer => {
    if (retailer.price) {
      prices.push(retailer.price);
    }
  });
  
  if (prices.length === 0) return null;
  
  // Calculate median price as recommended price
  prices.sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 
    ? (prices[mid - 1] + prices[mid]) / 2 
    : prices[mid];
    
  // Apply 10% discount to be competitive
  return Math.round(median * 0.9 * 100) / 100;
}

/**
 * Find the lowest competitor price
 */
function findLowestPrice(pricingData: ProductPricingData): number | null {
  const prices: number[] = [];
  
  if (pricingData.competitive_pricing.amazon.price) {
    prices.push(pricingData.competitive_pricing.amazon.price);
  }
  
  if (pricingData.competitive_pricing.ebay.recent_sold_average) {
    prices.push(pricingData.competitive_pricing.ebay.recent_sold_average);
  }
  
  pricingData.competitive_pricing.other_retailers.forEach(retailer => {
    if (retailer.price) {
      prices.push(retailer.price);
    }
  });
  
  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Find the highest competitor price
 */
function findHighestPrice(pricingData: ProductPricingData): number | null {
  const prices: number[] = [];
  
  if (pricingData.competitive_pricing.amazon.price) {
    prices.push(pricingData.competitive_pricing.amazon.price);
  }
  
  if (pricingData.competitive_pricing.ebay.recent_sold_average) {
    prices.push(pricingData.competitive_pricing.ebay.recent_sold_average);
  }
  
  pricingData.competitive_pricing.other_retailers.forEach(retailer => {
    if (retailer.price) {
      prices.push(retailer.price);
    }
  });
  
  return prices.length > 0 ? Math.max(...prices) : null;
}

/**
 * Calculate average competitor price
 */
function calculateAveragePrice(pricingData: ProductPricingData): number | null {
  const prices: number[] = [];
  
  if (pricingData.competitive_pricing.amazon.price) {
    prices.push(pricingData.competitive_pricing.amazon.price);
  }
  
  if (pricingData.competitive_pricing.ebay.recent_sold_average) {
    prices.push(pricingData.competitive_pricing.ebay.recent_sold_average);
  }
  
  pricingData.competitive_pricing.other_retailers.forEach(retailer => {
    if (retailer.price) {
      prices.push(retailer.price);
    }
  });
  
  if (prices.length === 0) return null;
  
  const sum = prices.reduce((acc, price) => acc + price, 0);
  return Math.round((sum / prices.length) * 100) / 100;
}

/**
 * Determine market position based on MSRP and competitor prices
 */
function determineMarketPosition(pricingData: ProductPricingData): string {
  const { msrp } = pricingData;
  const averagePrice = calculateAveragePrice(pricingData);
  
  if (!msrp || !averagePrice) return 'unknown';
  
  const priceRatio = averagePrice / msrp;
  
  if (priceRatio >= 0.9) return 'premium';
  if (priceRatio >= 0.7) return 'competitive';
  return 'budget';
}

/**
 * Calculate price competitiveness score (0-100)
 */
function calculateCompetitivenessScore(pricingData: ProductPricingData): number {
  const recommendedPrice = calculateRecommendedPrice(pricingData);
  const averagePrice = calculateAveragePrice(pricingData);
  
  if (!recommendedPrice || !averagePrice) return 50; // Default score
  
  // Lower price = higher competitiveness score
  const savings = (averagePrice - recommendedPrice) / averagePrice;
  const score = Math.min(100, Math.max(0, 50 + (savings * 100)));
  
  return Math.round(score);
}

/**
 * Save competitive pricing data to database
 */
export async function saveCompetitivePricingData(
  supabase: any,
  productId: string,
  pricingData: ProductPricingData
): Promise<void> {
  try {
    const mappedData = mapCompetitivePricingToDatabase(productId, pricingData);
    
    const { error } = await supabase
      .from('market_research_data')
      .upsert(mappedData, {
        onConflict: 'product_id'
      });
    
    if (error) {
      throw new Error(`Failed to save competitive pricing data: ${error.message}`);
    }
    
    console.log('✅ [COMPETITIVE_PRICING] Data saved successfully:', {
      productId,
      msrp: pricingData.msrp,
      amazonPrice: pricingData.competitive_pricing.amazon.price,
      ebayPrice: pricingData.competitive_pricing.ebay.recent_sold_average,
      competitivePrice: mappedData.competitive_price
    });
    
  } catch (error) {
    console.error('❌ [COMPETITIVE_PRICING] Save failed:', error);
    throw error;
  }
}

/**
 * Example usage function
 */
export function exampleUsage() {
  const sampleData: ProductPricingData = {
    msrp: 129.99,
    competitive_pricing: {
      amazon: {
        price: 89.99,
        prime_available: true,
        seller_type: "Amazon",
        rating: 4.5,
        review_count: 1250,
        url: "https://amazon.com/product/123",
        search_results_url: "https://amazon.com/s?k=product+name"
      },
      ebay: {
        new_price_range: {
          min: 75.00,
          max: 95.00
        },
        used_price_range: {
          min: 45.00,
          max: 65.00
        },
        recent_sold_average: 58.50,
        search_results_url: "https://ebay.com/sch/product+name",
        sold_listings_url: "https://ebay.com/sch/product+name&LH_Sold=1"
      },
      other_retailers: [
        {
          retailer: "Home Depot",
          price: 92.99,
          url: "https://homedepot.com/product",
          availability: "in_stock"
        },
        {
          retailer: "Walmart",
          price: 87.99,
          url: "https://walmart.com/product",
          availability: "online_only"
        }
      ]
    }
  };
  
  return mapCompetitivePricingToDatabase('product-id-123', sampleData);
} 