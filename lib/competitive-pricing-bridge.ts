// lib/competitive-pricing-bridge.ts
// Bridge between comprehensive analysis data and competitive pricing mapper

import { ComprehensiveProductAnalysis } from './types';
import { ProductPricingData, saveCompetitivePricingData } from './competitive-pricing-mapper';

/**
 * Convert comprehensive analysis data to competitive pricing format
 */
export function convertComprehensiveAnalysisToCompetitivePricing(
  analysis: ComprehensiveProductAnalysis
): ProductPricingData {
  return {
    // Extract MSRP from pricing recommendation
    msrp: analysis.pricing_recommendation?.msrp || null,
    
    // Use the competitive pricing data from the analysis
    competitive_pricing: {
      amazon: {
        price: analysis.competitive_pricing?.amazon?.price || null,
        prime_available: analysis.competitive_pricing?.amazon?.prime_available || null,
        seller_type: analysis.competitive_pricing?.amazon?.seller_type || "",
        rating: analysis.competitive_pricing?.amazon?.rating || null,
        review_count: analysis.competitive_pricing?.amazon?.review_count || null,
        url: analysis.competitive_pricing?.amazon?.url || "",
        search_results_url: analysis.competitive_pricing?.amazon?.search_results_url || ""
      },
      ebay: {
        new_price_range: {
          min: analysis.competitive_pricing?.ebay?.new_price_range?.min || null,
          max: analysis.competitive_pricing?.ebay?.new_price_range?.max || null
        },
        used_price_range: {
          min: analysis.competitive_pricing?.ebay?.used_price_range?.min || null,
          max: analysis.competitive_pricing?.ebay?.used_price_range?.max || null
        },
        recent_sold_average: analysis.competitive_pricing?.ebay?.recent_sold_average || null,
        search_results_url: analysis.competitive_pricing?.ebay?.search_results_url || "",
        sold_listings_url: analysis.competitive_pricing?.ebay?.sold_listings_url || ""
      },
      other_retailers: analysis.competitive_pricing?.other_retailers || []
    }
  };
}

/**
 * Save comprehensive analysis competitive pricing to database
 */
export async function saveComprehensiveAnalysisCompetitivePricing(
  supabase: any,
  productId: string,
  analysis: ComprehensiveProductAnalysis
): Promise<void> {
  try {
    console.log('🔗 [COMPETITIVE_PRICING_BRIDGE] Converting comprehensive analysis to competitive pricing format');
    
    const pricingData = convertComprehensiveAnalysisToCompetitivePricing(analysis);
    
    console.log('💰 [COMPETITIVE_PRICING_BRIDGE] Extracted pricing data:', {
      msrp: pricingData.msrp,
      amazonPrice: pricingData.competitive_pricing.amazon.price,
      ebayPrice: pricingData.competitive_pricing.ebay.recent_sold_average,
      otherRetailers: pricingData.competitive_pricing.other_retailers.length
    });
    
    // Use the competitive pricing mapper to save the data
    await saveCompetitivePricingData(supabase, productId, pricingData);
    
    console.log('✅ [COMPETITIVE_PRICING_BRIDGE] Competitive pricing data saved successfully');
    
  } catch (error) {
    console.error('❌ [COMPETITIVE_PRICING_BRIDGE] Failed to save competitive pricing:', error);
    throw error;
  }
}

/**
 * Extract MSRP from various data sources for backward compatibility
 */
export function extractMSRPFromEnrichmentData(enrichData: any): number | null {
  // Try multiple possible sources for MSRP
  const possibleMSRPSources = [
    enrichData?.pricing_recommendation?.msrp,
    enrichData?.msrp,
    enrichData?.originalMSRP,
    enrichData?.currentSellingPrice,
    enrichData?.price
  ];
  
  for (const source of possibleMSRPSources) {
    if (typeof source === 'number' && source > 0) {
      console.log('💰 [MSRP_EXTRACTION] Found MSRP:', source);
      return source;
    }
  }
  
  console.log('⚠️ [MSRP_EXTRACTION] No MSRP found in enrichment data');
  return null;
}

/**
 * Check if data contains comprehensive analysis structure
 */
export function isComprehensiveAnalysisData(data: any): data is ComprehensiveProductAnalysis {
  return data && 
         typeof data === 'object' && 
         data.basic_information && 
         data.competitive_pricing &&
         data.pricing_recommendation;
}

/**
 * Example usage for pipeline integration
 */
export async function integrateCompetitivePricingInPipeline(
  supabase: any,
  productId: string,
  analysisData: any
): Promise<void> {
  try {
    if (isComprehensiveAnalysisData(analysisData)) {
      console.log('🔍 [PIPELINE_INTEGRATION] Found comprehensive analysis data');
      await saveComprehensiveAnalysisCompetitivePricing(supabase, productId, analysisData);
    } else {
      console.log('⚠️ [PIPELINE_INTEGRATION] Data is not comprehensive analysis format');
      
      // Try to extract MSRP for legacy data
      const msrp = extractMSRPFromEnrichmentData(analysisData);
      if (msrp) {
        console.log('💰 [PIPELINE_INTEGRATION] Extracted MSRP from legacy data:', msrp);
        // You could save just the MSRP here if needed
      }
    }
  } catch (error) {
    console.error('❌ [PIPELINE_INTEGRATION] Integration failed:', error);
    throw error;
  }
} 