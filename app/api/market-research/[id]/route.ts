import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [MARKET-RESEARCH-API] Fetching data for product:', productId);

    // Fetch data from market_research_data table
    const { data: marketData, error: marketError } = await supabaseAdmin
      .from('market_research_data')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (marketError && marketError.code !== 'PGRST116') {
      console.error('❌ [MARKET-RESEARCH-API] Error fetching market data:', marketError);
    }

    // Fetch data from products table
    const { data: productInfo, error: productError } = await supabaseAdmin
      .from('products')
      .select('brand, category, year_released, specifications')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ [MARKET-RESEARCH-API] Error fetching product info:', productError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('✅ [MARKET-RESEARCH-API] Market data found:', !!marketData);
    console.log('✅ [MARKET-RESEARCH-API] Product info found:', !!productInfo);

    // Transform data into the expected format
    const response = {
      marketResearch: {
        amazonPrice: marketData?.amazon_price || 0,
        amazonLink: marketData?.amazon_link || '',
        ebayPrice: marketData?.ebay_price || 0,
        ebayLink: marketData?.ebay_link || '',
        msrp: marketData?.msrp || 0,
        competitivePrice: marketData?.competitive_price || 0,
      },
      specifications: {
        brand: productInfo?.brand || marketData?.brand || 'Unknown',
        category: productInfo?.category || marketData?.category || 'General',
        year: productInfo?.year_released || marketData?.year || 'Unknown',
        weight: productInfo?.specifications?.weight || marketData?.weight || 'Unknown',
        dimensions: productInfo?.specifications?.dimensions || marketData?.dimensions || 'Unknown',
      },
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ [MARKET-RESEARCH-API] Error in endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 