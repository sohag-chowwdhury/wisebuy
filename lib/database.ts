// =====================================================
// ADD THESE FUNCTIONS TO: lib/database.ts
// USING YOUR EXISTING API ENDPOINTS AND AI SERVICES
// =====================================================

// Import your existing services
import { claudeService, geminiService, calculatePricingSuggestion } from '@/lib/ai-services';
// API_ENDPOINTS import removed as it's not used
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';
import { logPipelineEvent } from '@/lib/supabase/realtime-database';
import type { PricingRequest } from '@/lib/types';

// =====================================================
// PHASE 1: PRODUCT ANALYSIS (Using your existing AI services)
// =====================================================

export async function executePhase1Analysis(productId: string): Promise<void> {


  try {
    // 1. Update phase status to running
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        progress_percentage: 0
      })
      .eq('product_id', productId)
      .eq('phase_number', 1);

    // 2. Get images for analysis
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId);

    if (imagesError || !images || images.length === 0) {
      throw new Error('No images found for analysis');
    }



    // 3. Analyze images using your existing Claude service
    const imageBuffers = await convertImagesToBuffers(images);
    const analysisResult = await claudeService.analyzeImages(imageBuffers);

    // 4. Save analysis results to product_analysis_data table
    const { error: saveError } = await supabaseAdmin
      .from('product_analysis_data')
      .insert({
        product_id: productId,
        product_name: analysisResult.model || 'Unknown Product',
        model: analysisResult.model,
        confidence: analysisResult.confidence,
        item_condition: analysisResult.condition,
        condition_details: analysisResult.defects?.join(', ') || 'No defects noted',
        detected_categories: categorizeFromModel(analysisResult.model),
        detected_brands: extractBrandFromModel(analysisResult.model),
        color_analysis: {},
        image_quality_score: calculateImageQuality(images),
        completeness_score: calculateCompleteness(images)
      });

    if (saveError) {
      console.error('❌ Failed to save analysis data:', saveError);
      throw saveError;
    }

    // 5. Update product with analysis results
    await supabaseAdmin
      .from('products')
      .update({
        name: analysisResult.model || 'Unknown Product',
        model: analysisResult.model,
        ai_confidence: analysisResult.confidence
      })
      .eq('id', productId);

    // 6. Complete phase and trigger next
    await completePhaseAndTriggerNext(productId, 1);



  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`❌ Phase 1 failed:`, err);
    await markPhaseAsFailed(productId, 1, err.message);
  }
}

// =====================================================
// PHASE 2: DATA ENRICHMENT (Using your existing /api/enrich)
// =====================================================

export async function executePhase2MarketResearch(productId: string): Promise<void> {


  try {
    // 1. Update phase status
    await updatePhaseStatus(productId, 2, 'running');

    // 2. Get Phase 1 analysis data
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from('product_analysis_data')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (analysisError || !analysisData) {
      throw new Error('No analysis data found from Phase 1');
    }



    // 3. Call your existing enrich API endpoint
    const enrichData = await callEnrichAPI(analysisData.model || analysisData.product_name);

    // 4. Save market data to market_research_data table (including specifications and eBay data)
    const { error: saveError } = await supabaseAdmin
      .from('market_research_data')
      .insert({
        product_id: productId,
        amazon_price: enrichData.msrp?.currentPrice || 0,
        amazon_link: enrichData.msrp?.sourceUrl || '',
        ebay_price: enrichData.competitive?.ebayPrice || 0,
        ebay_link: enrichData.competitive?.ebayUrl || '',
        msrp: enrichData.msrp?.msrp || 0,
        competitive_price: enrichData.competitive?.averageMarketPrice || 0,
        brand: enrichData.msrp?.brand || extractBrandFromModel(analysisData.model)?.[0] || 'Unknown',
        category: enrichData.msrp?.category || analysisData.detected_categories?.[0] || 'General',
        year: enrichData.specifications?.yearReleased || (analysisData.model?.match(/\b(19|20)\d{2}\b/)?.[0]) || null,
        weight: enrichData.specifications?.dimensions?.weight || null,
        dimensions: enrichData.specifications?.dimensions ? 
          `${enrichData.specifications.dimensions.length || 'L'} x ${enrichData.specifications.dimensions.width || 'W'} x ${enrichData.specifications.dimensions.height || 'H'}` : null
      });

    if (saveError) {
      console.error('❌ Failed to save market data:', saveError);
      throw saveError;
    }

    // 5. Complete phase and trigger next
    await completePhaseAndTriggerNext(productId, 2);



  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`❌ Phase 2 failed:`, err);
    await markPhaseAsFailed(productId, 2, err.message);
  }
}

// =====================================================
// PHASE 3: SMART PRICING (Using your existing /api/pricing)
// =====================================================

export async function executePhase3ListingGeneration(productId: string): Promise<void> {


  try {
    // 1. Update phase status
    await updatePhaseStatus(productId, 3, 'running');

    // 2. Get data from previous phases
    const [analysisResult, marketResult] = await Promise.all([
      supabaseAdmin.from('product_analysis_data').select('*').eq('product_id', productId).single(),
      supabaseAdmin.from('product_market_data').select('*').eq('product_id', productId).single()
    ]);

    const analysisData = analysisResult.data;
    const marketData = marketResult.data;

    if (!analysisData || !marketData) {
      throw new Error('Missing data from previous phases');
    }



    // 3. Prepare pricing request for your existing pricing API
    const pricingRequest: PricingRequest = {
      productModel: analysisData.model || analysisData.product_name,
      condition: analysisData.item_condition,
      currentSellingPrice: marketData.amazon_price || marketData.msrp || 100,
      competitiveData: {
        marketDemand: marketData.market_demand,
        platforms: {
          ebay: {
            averagePrice: marketData.competitive_price,
            priceRange: { low: marketData.competitive_price * 0.9, high: marketData.competitive_price * 1.1 },
            activeListings: marketData.competitor_count,
            soldListings: Math.floor(Math.random() * 50) + 10
          },
          facebook: {
            averagePrice: marketData.competitive_price,
            priceRange: { low: marketData.competitive_price * 0.9, high: marketData.competitive_price * 1.1 }
          }
        },
        bestPlatforms: [],
        recommendedConditions: [],
        insights: '',
      }
    };

    // 4. Call your existing pricing calculation function
    const pricingSuggestion = calculatePricingSuggestion(pricingRequest);

    // 5. Generate listings for multiple platforms
    const platforms: Array<'ebay' | 'amazon' | 'facebook' | 'mercari' | 'poshmark'> = ['ebay', 'amazon', 'facebook', 'mercari', 'poshmark'];
    const listings: any[] = [];

    for (const platform of platforms) {
      const listing = generatePlatformListing({
        platform,
        productName: analysisData.product_name,
        model: analysisData.model,
        condition: analysisData.item_condition,
        conditionDetails: analysisData.condition_details,
        suggestedPrice: pricingSuggestion.suggestedPrice,
        priceRange: pricingSuggestion.priceRange,
        brand: marketData.brand,
        category: marketData.category,
        pricingStrategy: pricingSuggestion.pricingStrategy
      });

      listings.push({
        product_id: productId,
        platform: platform,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        suggested_price: listing.price,
        keywords: listing.keywords,
        seo_score: listing.seoScore,
        listing_status: 'draft',
        platform_specific_data: {
          pricing_strategy: pricingSuggestion.pricingStrategy,
          confidence: pricingSuggestion.confidence,
          reasoning: pricingSuggestion.reasoning
        }
      });
    }

    // 6. Save all listings to product_listings table
    const { error: saveError } = await supabaseAdmin
      .from('product_listings')
      .insert(listings);

    if (saveError) {
      console.error('❌ Failed to save listings:', saveError);
      throw saveError;
    }

    // 7. Complete phase and trigger next
    await completePhaseAndTriggerNext(productId, 3);



  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`❌ Phase 3 failed:`, err);
    await markPhaseAsFailed(productId, 3, err.message);
  }
}

// =====================================================
// PHASE 4: SEO & PUBLISHING (Using your existing /api/seo)
// =====================================================

export async function executePhase4MonitoringSetup(productId: string): Promise<void> {


  try {
    // 1. Update phase status
    await updatePhaseStatus(productId, 4, 'running');

    // 2. Get all previous data
    const [analysisResult, marketResult, listingsResult] = await Promise.all([
      supabaseAdmin.from('product_analysis_data').select('*').eq('product_id', productId).single(),
      supabaseAdmin.from('product_market_data').select('*').eq('product_id', productId).single(),
      supabaseAdmin.from('product_listings').select('*').eq('product_id', productId)
    ]);

    const analysisData = analysisResult.data;
    const marketData = marketResult.data;
    const listings = listingsResult.data || [];

    if (!analysisData || !marketData) {
      throw new Error('Missing data from previous phases');
    }

    // 3. Prepare SEO request for your existing SEO API
    const seoRequest = {
      productModel: analysisData.model || analysisData.product_name,
      specifications: {
        brand: marketData.brand,
        category: marketData.category,
        condition: analysisData.item_condition,
        features: analysisData.condition_details ? [analysisData.condition_details] : []
      },
      msrpData: {
        msrp: marketData.msrp,
        currentPrice: marketData.amazon_price,
        brand: marketData.brand,
        category: marketData.category
      },
      condition: analysisData.item_condition,
      finalPrice: listings[0]?.suggested_price || marketData.competitive_price
    };

    // 4. Call your existing SEO service
    const seoData = await callSEOAPI(seoRequest);

    // 5. Set up monitoring configuration
    const monitoringConfig = {
      product_id: productId,
      monitor_price: true,
      price_threshold_upper: marketData.competitive_price * 1.2,
      price_threshold_lower: marketData.competitive_price * 0.8,
      monitor_competition: true,
      competitor_threshold: marketData.competitor_count + 5,
      monitor_demand: true,
      check_frequency: 'daily',
      alert_email: true,
      alert_sms: false,
      notification_settings: {
        priceChanges: true,
        newCompetitors: true,
        demandSpikes: true,
        stockAlerts: false,
        seoRankings: true
      },
      keywords_to_track: seoData.keywords || [marketData.brand, marketData.category],
      enabled: true,
      seo_data: {
        title: seoData.title,
        meta_description: seoData.metaDescription,
        keywords: seoData.keywords,
        content: seoData.content
      }
    };

    // 6. Save monitoring config to product_monitoring table
    const { error: saveError } = await supabaseAdmin
      .from('product_monitoring')
      .insert(monitoringConfig);

    if (saveError) {
      console.error('❌ Failed to save monitoring config:', saveError);
      throw saveError;
    }

    // 7. Complete final phase
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      })
      .eq('product_id', productId)
      .eq('phase_number', 4);

    // 8. Mark entire product as completed
    await supabaseAdmin
      .from('products')
      .update({
        status: 'completed',
        is_pipeline_running: false,
        current_phase: 4
      })
      .eq('id', productId);



    // Automatically trigger AI market research after pipeline completion
    try {
  
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const researchResponse = await fetch(`${baseUrl}/api/dashboard/products/${productId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (researchResponse.ok) {
        const _researchResult = await researchResponse.json();

      } else {
        console.warn(`⚠️ [DATABASE] Market research failed:`, await researchResponse.text());
      }
      
    } catch (researchError) {
      console.warn(`⚠️ [DATABASE] Market research error:`, researchError);
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`❌ Phase 4 failed:`, err);
    await markPhaseAsFailed(productId, 4, err.message);
  }
}

// =====================================================
// HELPER FUNCTIONS FOR API CALLS
// =====================================================

/**
 * Call your existing enrich API endpoint
 */
async function callEnrichAPI(productModel: string): Promise<any> {
  try {


    // Use your existing gemini service directly
    const [msrpData, specifications, competitiveData] = await Promise.all([
      geminiService.getMSRPData(productModel),
      geminiService.getSpecifications(productModel),
      geminiService.getCompetitiveAnalysis(productModel)
    ]);

    return {
      msrp: msrpData,
      specifications: specifications,
      competitive: competitiveData
    };

  } catch (error) {
    console.error('❌ Enrich API call failed:', error);
    // Return fallback data
    return {
      msrp: { currentPrice: 0, msrp: 0, brand: 'Unknown', category: 'General' },
      specifications: { features: [] },
      competitive: { averageMarketPrice: 0, marketDemand: 'medium', totalListings: 0 }
    };
  }
}

/**
 * Call your existing SEO API endpoint
 */
async function callSEOAPI(seoRequest: any): Promise<any> {
  try {


    // Use your existing claude service for SEO generation
    const seoData = await claudeService.generateSEOContent(seoRequest);

    return seoData;

  } catch (error) {
    console.error('❌ SEO API call failed:', error);
    // Return fallback SEO data
    return {
      title: `${seoRequest.productModel} - ${seoRequest.condition} Condition`,
      metaDescription: `Buy ${seoRequest.productModel} in ${seoRequest.condition} condition. Great value and fast shipping.`,
      keywords: [seoRequest.productModel, seoRequest.msrpData?.brand, seoRequest.condition].filter(Boolean),
      content: `Quality ${seoRequest.productModel} available for purchase.`
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Convert image URLs to buffers for AI analysis
 */
async function convertImagesToBuffers(images: any[]): Promise<Buffer[]> {
  const buffers: Buffer[] = [];

  for (const image of images) {
    try {
      const response = await fetch(image.image_url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        buffers.push(Buffer.from(arrayBuffer));
      }
    } catch (error) {
      console.error(`Failed to fetch image: ${image.image_url}`, error);
    }
  }

  return buffers;
}

/**
 * Extract brand from product model
 */
function extractBrandFromModel(model: string): string[] {
  if (!model) return ['Unknown'];
  
  const brands = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Dell', 'HP'];
  const lowerModel = model.toLowerCase();
  
  const detectedBrand = brands.find(brand => lowerModel.includes(brand.toLowerCase()));
  return detectedBrand ? [detectedBrand] : ['Unknown'];
}

/**
 * Categorize product from model
 */
function categorizeFromModel(model: string): string[] {
  if (!model) return ['General'];
  
  const lowerModel = model.toLowerCase();
  
  if (lowerModel.includes('iphone') || lowerModel.includes('phone')) {
    return ['Electronics', 'Cell Phones'];
  }
  if (lowerModel.includes('laptop') || lowerModel.includes('macbook')) {
    return ['Electronics', 'Computers'];
  }
  if (lowerModel.includes('shoe') || lowerModel.includes('sneaker')) {
    return ['Clothing', 'Shoes'];
  }
  
  return ['Electronics', 'General'];
}

/**
 * Calculate image quality score
 */
function calculateImageQuality(images: any[]): number {
  const avgFileSize = images.reduce((sum, img) => sum + (img.file_size || 0), 0) / images.length;
  
  let score = 60;
  if (avgFileSize > 1000000) score += 25; // 1MB+
  else if (avgFileSize > 500000) score += 15; // 500KB+
  
  return Math.min(100, score);
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(images: any[]): number {
  let score = 30 + (images.length * 10); // Base + 10 per image
  if (images.some(img => img.is_primary)) score += 10;
  return Math.min(100, score);
}

/**
 * Calculate profit margin
 */
function _calculateProfitMargin(retailPrice: number, marketPrice: number): number {
  if (!retailPrice || !marketPrice) return 0;
  return ((marketPrice - retailPrice) / retailPrice) * 100;
}

/**
 * Generate platform-specific listing
 */
function generatePlatformListing(params: {
  platform: 'ebay' | 'amazon' | 'facebook' | 'mercari' | 'poshmark';
  productName: string;
  model: string;
  condition: string;
  conditionDetails: string;
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  brand: string;
  category: string;
  pricingStrategy: string;
}): any {
  const platformTemplates = {
    ebay: {
      titleFormat: '{PRODUCT} - {CONDITION} - {STRATEGY}!',
      descriptionTemplate: 'Authentic {PRODUCT} in {CONDITION} condition. {DETAILS}'
    },
    amazon: {
      titleFormat: '{PRODUCT} | {CONDITION} Condition',
      descriptionTemplate: '{PRODUCT} - Quality assured. {DETAILS}'
    },
    facebook: {
      titleFormat: '{PRODUCT} for Sale - {CONDITION}',
      descriptionTemplate: 'Selling {PRODUCT}. {DETAILS} Local pickup available.'
    },
    mercari: {
      titleFormat: '{PRODUCT} - {CONDITION} ✨',
      descriptionTemplate: '{PRODUCT} in great shape! {DETAILS}'
    },
    poshmark: {
      titleFormat: '{PRODUCT} | {CONDITION} | {BRAND}',
      descriptionTemplate: 'Stylish {PRODUCT}. {DETAILS} Ships fast!'
    }
  } as const;

  const template = platformTemplates[params.platform as keyof typeof platformTemplates] || platformTemplates.ebay;
  
  const title = template.titleFormat
    .replace('{PRODUCT}', params.productName)
    .replace('{CONDITION}', params.condition)
    .replace('{STRATEGY}', params.pricingStrategy || 'Great Price')
    .replace('{BRAND}', params.brand);

  const description = template.descriptionTemplate
    .replace(/{PRODUCT}/g, params.productName)
    .replace(/{CONDITION}/g, params.condition)
    .replace(/{DETAILS}/g, params.conditionDetails || 'See photos for details')
    .replace(/{BRAND}/g, params.brand);

  return {
    title: title.substring(0, params.platform === 'ebay' ? 80 : 200),
    description,
    price: params.platform === 'facebook' ? params.priceRange?.min || params.suggestedPrice : params.suggestedPrice,
    keywords: [params.productName, params.brand, params.condition, params.category].filter(Boolean),
    seoScore: 85
  };
}

// =====================================================
// PHASE MANAGEMENT HELPERS (Same as before)
// =====================================================

async function completePhaseAndTriggerNext(productId: string, currentPhase: number): Promise<void> {
  try {
    // Complete current phase
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      })
      .eq('product_id', productId)
      .eq('phase_number', currentPhase);

    // If not last phase, trigger next
    if (currentPhase < 4) {
      const nextPhase = currentPhase + 1;
      
      // Update product current phase
      await supabaseAdmin
        .from('products')
        .update({ current_phase: nextPhase })
        .eq('id', productId);

      // Execute next phase with small delay
      setTimeout(async () => {
        switch (nextPhase) {
          case 2:
            await executePhase2MarketResearch(productId);
            break;
          case 3:
            await executePhase3ListingGeneration(productId);
            break;
          case 4:
            await executePhase4MonitoringSetup(productId);
            break;
        }
      }, 2000); // 2 second delay between phases
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ [completePhaseAndTriggerNext] Error:', err);
  }
}

async function updatePhaseStatus(productId: string, phaseNumber: number, status: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status,
        started_at: status === 'running' ? new Date().toISOString() : undefined,
        progress_percentage: status === 'running' ? 0 : undefined
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ [updatePhaseStatus] Error:', err);
  }
}

async function markPhaseAsFailed(productId: string, phaseNumber: number, errorMessage: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber);

    // Mark product as error
    await supabaseAdmin
      .from('products')
      .update({
        status: 'error',
        is_pipeline_running: false,
        error_message: errorMessage
      })
      .eq('id', productId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ [markPhaseAsFailed] Error:', err);
  }
}

// =====================================================
// UPDATED startPipelineProcessing FUNCTION
// =====================================================

/**
 * REPLACE this function in lib/database.ts
 */
export async function startPipelineProcessing(productId: string): Promise<void> {
  try {
  

    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'processing',
        is_pipeline_running: true,
        current_phase: 1
      })
      .eq('id', productId);

    // Log pipeline start
    await logPipelineEvent(
      productId,
      1,
      'info',
      'Pipeline processing started using existing APIs',
      'pipeline_start'
    );

    // ✅ EXECUTE PHASE 1 USING YOUR EXISTING AI SERVICES
    await executePhase1Analysis(productId);



  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Pipeline processing failed:', err);
    
    // Mark product as error
    await supabaseAdmin
      .from('products')
      .update({
        status: 'error',
        is_pipeline_running: false,
        error_message: err.message
      })
      .eq('id', productId);

    // Log error
    await logPipelineEvent(
      productId,
      1,
      'error',
      `Pipeline start failed: ${err.message}`,
      'pipeline_error'
    );

    throw err;
  }
}

// =====================================================
// DASHBOARD DATA FETCHING FUNCTIONS
// =====================================================

/**
 * Fetch dashboard statistics for a specific user
 */
export async function fetchDashboardStats(userId: string): Promise<any> {
  try {


    const { data: stats, error } = await supabaseAdmin
      .from('products')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    // Calculate statistics
    const statusCounts = (stats || []).reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dashboardStats = {
      totalProcessing: statusCounts['processing'] || 0,
      totalPaused: statusCounts['paused'] || 0,
      totalError: statusCounts['error'] || 0,
      totalCompleted: statusCounts['completed'] || 0,
      totalPublished: statusCounts['published'] || 0
    };


    return dashboardStats;

  } catch (error) {
    console.error(`❌ [DB] Failed to fetch dashboard stats:`, error);
    throw error;
  }
}

/**
 * Fetch products with filtering and pagination for dashboard
 */
export async function fetchDashboardProducts(
  userId: string,
  options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<any> {
  try {
    const { status, search, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;



    // Build base query
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        product_images(
          id,
          image_url,
          is_primary
        ),
        product_market_data(
          amazon_price,
          competitive_price
        ),
        product_listings(
          platform,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // Get total count for pagination
    const countQuery = supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (status && status !== 'all') {
      countQuery.eq('status', status);
    }
    if (search) {
      countQuery.or(`name.ilike.%${search}%,model.ilike.%${search}%`);
    }

    // Execute queries in parallel
    const [{ data: products, error: productsError }, { count, error: countError }] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery
    ]);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (countError) {
      throw new Error(`Failed to fetch count: ${countError.message}`);
    }

    // Transform data to match dashboard interface
    const transformedProducts = (products || []).map((product: any) => {
      // Get primary image or first image
      const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0];
      
      // Get price from market data
      const marketData = product.product_market_data?.[0];
      const price = marketData?.amazon_price || marketData?.competitive_price;

      // Get platforms from listings
      const platforms = product.product_listings?.map((listing: any) => listing.platform) || ['wordpress'];

      return {
        id: product.id,
        name: product.name || 'Unknown Product',
        model: product.model || 'Unknown Model',
        status: product.status,
        currentPhase: product.current_phase || 1,
        progress: calculateProgressFromPhase(product.current_phase, product.status),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        thumbnailUrl: primaryImage?.image_url,
        error: product.error_message,
        price: price ? parseFloat(price) : undefined,
        platforms: [...new Set(platforms)], // Remove duplicates
        brand: product.brand,
        category: product.category
      };
    });



    return {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error(`❌ [DB] Failed to fetch dashboard products:`, error);
    throw error;
  }
}

/**
 * Helper function to calculate progress based on phase and status
 */
function calculateProgressFromPhase(phase: number, status: string): number {
  if (status === 'completed') return 100;
  if (status === 'error') return Math.max(0, (phase - 1) * 25);
  if (status === 'processing') {
    // Phases 1-4, each represents 25% progress
    return Math.min(100, phase * 25);
  }
  return 0;
}

/**
 * Get product by ID with all related data
 */
export async function getProductWithDetails(productId: string, userId?: string): Promise<any> {
  try {


    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        product_images(*),
        product_analysis_data(*),
        product_market_data(*),
        product_listings(*),
        product_monitoring(*),
        pipeline_phases(*),
        pipeline_logs(*)
      `)
      .eq('id', productId);

    // Add user filter if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: product, error } = await query.single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }


    return product;

  } catch (error) {
    console.error(`❌ [DB] Failed to fetch product details:`, error);
    throw error;
  }
}