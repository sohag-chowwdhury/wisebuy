// lib/comprehensive-analysis-mapper.ts
// Helper functions to map comprehensive analysis results to existing database tables

import { ComprehensiveProductAnalysis } from './types';
import { Product, MarketResearchData } from '../types/supabase';

/**
 * Maps comprehensive analysis results to the products table fields
 */
export function mapAnalysisToProductFields(
  analysis: ComprehensiveProductAnalysis,
  existingProduct: Partial<Product>
): Partial<Product> {
  return {
    ...existingProduct,
    
    // Basic information
    name: analysis.basic_information.product_name || existingProduct.name,
    model: analysis.basic_information.model_number || existingProduct.model,
    brand: analysis.basic_information.brand || existingProduct.brand,
    category: analysis.basic_information.category_name || existingProduct.category,
    manufacturer: analysis.basic_information.manufacturer,
    upc: analysis.basic_information.upc,
    item_number: analysis.basic_information.item_number,
    product_description: analysis.product_description,
    
    // Category information from WooCommerce with enhanced validation
    woocommerce_category_id: (() => {
      const categoryName = analysis.basic_information.category_name;
      const categoryId = analysis.basic_information.category_id;
      
      console.log(`📝 [MAPPER] Processing category: "${categoryName}" (ID: ${categoryId})`);
      
      // Priority 1: Use the category_id from AI if valid and non-zero
      if (categoryId && categoryId > 0) {
        console.log(`✅ [MAPPER] Using AI selected category ID: ${categoryId} for "${categoryName}"`);
        return categoryId;
      }
      
      // Priority 2: If no ID but has valid category name
      if (categoryName && !categoryName.startsWith("Not Existing Category")) {
        // Smart mapping for known category patterns
        const categoryLower = categoryName.toLowerCase();
        
        // Map common category names to likely IDs
        if (categoryLower.includes('home') && categoryLower.includes('kitchen')) {
          console.log(`🔧 [MAPPER] Detected Home & Kitchen category, using ID 2 (common fallback)`);
          return 2;
        } else if (categoryLower.includes('electronics')) {
          console.log(`🔧 [MAPPER] Detected Electronics category, using ID 3 (common fallback)`);
          return 3;
        } else if (categoryLower.includes('uncategorized')) {
          console.log(`🔧 [MAPPER] Detected Uncategorized category, using ID 1`);
          return 1;
        } else {
          console.log(`📝 [MAPPER] Unknown category "${categoryName}", defaulting to Uncategorized (ID: 1)`);
          return 1;
        }
      }
      
      // Priority 3: If it's a "Not Existing Category", keep null for manual review
      if (categoryName?.startsWith("Not Existing Category")) {
        console.log(`⚠️ [MAPPER] "Not Existing Category" detected: "${categoryName}", keeping null for manual review`);
        return null;
      }
      
      // Final fallback: Force Uncategorized if nothing else works
      console.warn(`🚨 [MAPPER] No valid category found (name: "${categoryName}", id: ${categoryId}), forcing Uncategorized (ID: 1)`);
      return 1;
    })(),
    
    // Physical dimensions as separate fields
    width_inches: analysis.specifications?.width_inches,
    height_inches: analysis.specifications?.height_inches,
    depth_inches: analysis.specifications?.depth_inches,
    weight_lbs: analysis.specifications?.weight_lbs,
    
    // ENHANCED: Map all technical details to existing technical_specs JSONB field
    technical_specs: {
      ...existingProduct.technical_specs,
      power_requirements: analysis.technical_details?.power_requirements || {},
      electrical_specs: analysis.technical_details?.electrical_specs || {},
      assembly: analysis.technical_details?.assembly || {},
      materials: analysis.technical_details?.materials || {},
      features: analysis.technical_details?.features || [],
      // Also include weight source in specs
      weight_source: analysis.specifications?.weight_source,
    },
    
    // New JSONB fields for comprehensive data
    compliance_data: {
      safety_certifications: analysis.compliance_and_safety.safety_certifications,
      country_of_origin: analysis.compliance_and_safety.country_of_origin,
      prop_65_warning: analysis.compliance_and_safety.prop_65_warning,
      warranty_terms: analysis.compliance_and_safety.warranty_terms,
    },
    
    documentation_data: {
      official_product_page: analysis.websites_and_documentation.official_product_page,
      instruction_manual: analysis.websites_and_documentation.instruction_manual,
      additional_resources: analysis.websites_and_documentation.additional_resources,
    },
    
    visual_content_needs: {
      lifestyle_shots_required: analysis.visual_content_needs.lifestyle_shots_required,
      detail_shots_required: analysis.visual_content_needs.detail_shots_required,
      additional_photos_needed: analysis.visual_content_needs.additional_photos_needed,
    },
    
    analysis_metadata: {
      analysis_date: analysis.analysis_metadata.analysis_date,
      analyst_notes: analysis.analysis_metadata.analyst_notes,
      data_confidence_level: analysis.analysis_metadata.data_confidence_level,
      missing_information: analysis.analysis_metadata.missing_information,
    },
  };
}

/**
 * Maps comprehensive analysis results to the product_market_data table fields
 */
export function mapAnalysisToMarketResearchFields(
  analysis: ComprehensiveProductAnalysis,
  existingMarketData: Partial<MarketResearchData>
): Partial<MarketResearchData> {
  return {
    ...existingMarketData,
    
    // Basic info
    brand: analysis.basic_information.brand || existingMarketData.brand,
    
    // Enhanced Amazon data - FIXED: use amazon_url not amazon_link
    amazon_price: analysis.competitive_pricing.amazon.price || existingMarketData.amazon_price,
    amazon_url: analysis.competitive_pricing.amazon.url || existingMarketData.amazon_url,
    amazon_prime_available: analysis.competitive_pricing.amazon.prime_available,
    amazon_seller_type: analysis.competitive_pricing.amazon.seller_type,
    amazon_rating: analysis.competitive_pricing.amazon.rating,
    amazon_review_count: analysis.competitive_pricing.amazon.review_count,
    amazon_search_results_url: analysis.competitive_pricing.amazon.search_results_url,
    
    // Enhanced eBay data - FIXED: use ebay_url not ebay_link
    ebay_price: analysis.competitive_pricing.ebay.recent_sold_average || existingMarketData.ebay_price,
    ebay_url: analysis.competitive_pricing.ebay.url || existingMarketData.ebay_url,
    ebay_new_price_min: analysis.competitive_pricing.ebay.new_price_range?.min,
    ebay_new_price_max: analysis.competitive_pricing.ebay.new_price_range?.max,
    ebay_used_price_min: analysis.competitive_pricing.ebay.used_price_range?.min,
    ebay_used_price_max: analysis.competitive_pricing.ebay.used_price_range?.max,
    ebay_recent_sold_average: analysis.competitive_pricing.ebay.recent_sold_average,
    ebay_search_results_url: analysis.competitive_pricing.ebay.search_results_url,
    ebay_sold_listings_url: analysis.competitive_pricing.ebay.sold_listings_url,
    
    // Other retailers data - convert array to object format
    other_retailers_data: analysis.competitive_pricing.other_retailers.reduce((acc, retailer) => {
      const retailerName = retailer.retailer.toLowerCase().replace(/\s+/g, '_');
      acc[retailerName] = {
        price: retailer.price,
        url: retailer.url,
        availability: retailer.availability
      };
      return acc;
    }, {} as Record<string, any>),
    
    // Market analysis
    target_demographics: analysis.market_analysis.target_demographics,
    seasonal_demand_pattern: analysis.market_analysis.seasonal_demand,
    complementary_products: analysis.market_analysis.complementary_products,
    key_selling_points: analysis.market_analysis.key_selling_points,
    
    // Logistics assessment
    logistics_data: {
      package_condition: analysis.logistics_assessment.package_condition,
      fragility_level: analysis.logistics_assessment.fragility_level,
      shipping_considerations: analysis.logistics_assessment.shipping_considerations,
      storage_requirements: analysis.logistics_assessment.storage_requirements,
      return_policy_implications: analysis.logistics_assessment.return_policy_implications,
    },
    
    // Pricing recommendations
    pricing_recommendation: {
      suggested_price_range: {
        min: analysis.pricing_recommendation.suggested_price_range.min,
        max: analysis.pricing_recommendation.suggested_price_range.max,
      },
      justification: analysis.pricing_recommendation.justification,
      profit_margin_estimate: analysis.pricing_recommendation.profit_margin_estimate,
      confidence_level: analysis.analysis_metadata.data_confidence_level,
    },
    
    // Technical specifications mapped to structured data
    dimensions: analysis.specifications ? 
      `${analysis.specifications.height_inches}"H x ${analysis.specifications.width_inches}"W x ${analysis.specifications.depth_inches}"D` : 
      existingMarketData.dimensions,
    weight: analysis.specifications?.weight_lbs ? 
      `${analysis.specifications.weight_lbs} lbs` : 
      existingMarketData.weight,
  };
}

/**
 * Complete mapping function that handles both tables
 */
export function mapComprehensiveAnalysisToDatabase(
  analysis: ComprehensiveProductAnalysis,
  existingProduct: Partial<Product> = {},
  existingMarketData: Partial<MarketResearchData> = {}
) {
  return {
    productData: mapAnalysisToProductFields(analysis, existingProduct),
    marketResearchData: mapAnalysisToMarketResearchFields(analysis, existingMarketData),
  };
}

/**
 * Example usage function
 */
export async function saveComprehensiveAnalysisToDatabase(
  analysis: ComprehensiveProductAnalysis,
  productId: string,
  supabaseClient: any // Replace with your Supabase client type
) {
  try {
    // Get existing data
    const { data: existingProduct } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    const { data: existingMarketData } = await supabaseClient
      .from('product_market_data')
      .select('*')
      .eq('product_id', productId)
      .single();
    
    // Map the analysis data
    const { productData, marketResearchData } = mapComprehensiveAnalysisToDatabase(
      analysis,
      existingProduct || {},
      existingMarketData || {}
    );
    
    // Update products table
    const { error: productError } = await supabaseClient
      .from('products')
      .update(productData)
      .eq('id', productId);
    
    if (productError) throw productError;
    
    // Update or insert market research data
    const { error: marketError } = await supabaseClient
      .from('product_market_data')
      .upsert({
        ...marketResearchData,
        product_id: productId,
      }, {
        onConflict: 'product_id'
      });
    
    if (marketError) throw marketError;
    
    console.log('✅ Comprehensive analysis data saved to database');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to save comprehensive analysis data:', error);
    throw error;
  }
} 