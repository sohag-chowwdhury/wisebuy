import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    // Validate product ID
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    console.log(`🔧 [PHASE2-UPDATE] Updating Phase 2 data for product: ${productId}`, {
      marketResearch: data.marketResearch ? 'present' : 'missing',
      specifications: data.specifications ? 'present' : 'missing'
    });

    // Validate required data structure
    if (!data.marketResearch && !data.specifications) {
      return NextResponse.json(
        { error: 'Either marketResearch or specifications data is required' },
        { status: 400 }
      );
    }

    const updates = [];

    // 1. Update relevant fields in products table
    const productUpdate: any = {
      updated_at: new Date().toISOString()
    };

    // Update brand and category if provided in specifications
    if (data.specifications?.brand) {
      productUpdate.brand = data.specifications.brand;
    }
    if (data.specifications?.category) {
      productUpdate.category = data.specifications.category;
    }
    if (data.specifications?.year) {
      productUpdate.year_released = data.specifications.year;
    }
    if (data.specifications?.technical_specs) {
      productUpdate.technical_specs = data.specifications.technical_specs;
    }

    console.log(`🔧 [PHASE2-UPDATE] Updating products table with:`, productUpdate);

    const { error: productError } = await supabaseAdmin
      .from('products')
      .update(productUpdate)
      .eq('id', productId);

    if (productError) {
      console.error('❌ [PHASE2-UPDATE] Error updating products table:', productError);
      return NextResponse.json(
        { 
          error: 'Failed to update product table',
          details: productError.message,
          code: productError.code
        },
        { status: 500 }
      );
    }

    updates.push('products table');

    // 2. Upsert market_research_data table
    const marketData = {
      product_id: productId,
      // Pricing data - handle both null and undefined values
      amazon_price: data.marketResearch?.amazonPrice ?? null,
      amazon_url: data.marketResearch?.amazonLink || null,
      ebay_price: data.marketResearch?.ebayPrice ?? null,
      ebay_url: data.marketResearch?.ebayLink || null,
      msrp: data.marketResearch?.msrp ?? null,
      competitive_price: data.marketResearch?.competitivePrice ?? null,
      
      // Specifications data
      brand: data.specifications?.brand || null,
      category: data.specifications?.category || null,
      year: data.specifications?.year || null,
      weight: data.specifications?.weight || null,
      dimensions: data.specifications?.dimensions || null,
      
      // Additional fields from database schema - set to safe defaults
      amazon_prime_available: null,
      amazon_seller_type: null,
      amazon_rating: null,
      amazon_review_count: null,
      amazon_search_results_url: null,
      ebay_new_price_min: null,
      ebay_new_price_max: null,
      ebay_used_price_min: null,
      ebay_used_price_max: null,
      ebay_recent_sold_average: null,
      ebay_search_results_url: null,
      ebay_sold_listings_url: null,
      other_retailers_data: {},
      target_demographics: [],
      seasonal_demand_pattern: null,
      complementary_products: [],
      key_selling_points: [],
      logistics_data: {},
      pricing_recommendation: {},
      
      updated_at: new Date().toISOString()
    };

    console.log(`🔧 [PHASE2-UPDATE] Upserting market_research_data with:`, {
      product_id: marketData.product_id,
      hasAmazonPrice: marketData.amazon_price !== null,
      hasEbayPrice: marketData.ebay_price !== null,
      hasMsrp: marketData.msrp !== null,
      hasBrand: marketData.brand !== null
    });

    const { error: marketError, data: marketResult } = await supabaseAdmin
      .from('market_research_data')
      .upsert(marketData, { onConflict: 'product_id' })
      .select('id');

    if (marketError) {
      console.error('❌ [PHASE2-UPDATE] Error updating market_research_data table:', {
        message: marketError.message,
        details: marketError.details,
        hint: marketError.hint,
        code: marketError.code
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update market research data';
      if (marketError.code === '23505') {
        errorMessage = 'Duplicate entry conflict - please try again';
      } else if (marketError.code === '23503') {
        errorMessage = 'Product not found or access denied';
      } else if (marketError.code === '42501') {
        errorMessage = 'Permission denied - please check your access rights';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: marketError.message,
          code: marketError.code,
          hint: marketError.hint
        },
        { status: 500 }
      );
    }

    updates.push('market_research_data table');

    console.log(`✅ [PHASE2-UPDATE] Successfully updated: ${updates.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Phase 2 data updated successfully`,
      updated: updates,
      recordId: marketResult?.[0]?.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PHASE2-UPDATE] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to update Phase 2 data',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'unexpected_error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    console.log(`🔍 [PHASE2-GET] Fetching Phase 2 data for product: ${productId}`);

    // Fetch data from both tables
    const [productResult, marketResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, brand, category, year_released, technical_specs, created_at, updated_at')
        .eq('id', productId)
        .single(),
      
      supabaseAdmin
        .from('market_research_data')
        .select('*')
        .eq('product_id', productId)
        .single()
    ]);

    if (productResult.error) {
      return NextResponse.json(
        { error: `Product not found: ${productResult.error.message}` },
        { status: 404 }
      );
    }

    const product = productResult.data;
    const market = marketResult.error ? null : marketResult.data;

    // Combine data for Phase 2 form
    const phase2Data = {
      marketResearch: {
        amazonPrice: market?.amazon_price || 0,
        amazonLink: market?.amazon_url || '',
        ebayPrice: market?.ebay_price || 0,
        ebayLink: market?.ebay_url || '',
        msrp: market?.msrp || 0,
        competitivePrice: market?.competitive_price || 0,
      },
      specifications: {
        brand: product.brand || market?.brand || 'Unknown',
        category: product.category || market?.category || 'General',
        year: product.year_released || market?.year || 'Unknown',
        weight: market?.weight || 'Unknown',
        dimensions: market?.dimensions || 'Unknown',
        // Individual dimension fields will be parsed from dimensions on frontend
        height: '',
        width: '',
        length: '',
        technical_specs: product.technical_specs || {},
      },
      lastUpdated: product.updated_at
    };

    return NextResponse.json({
      success: true,
      data: phase2Data
    });

  } catch (error) {
    console.error('❌ [PHASE2-GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Phase 2 data' },
      { status: 500 }
    );
  }
} 