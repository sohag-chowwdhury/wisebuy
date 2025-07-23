// app/api/dashboard/products/[id]/research/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { researchProductWithAI, saveMarketResearchToDatabase } from '@/lib/ai-market-research'
import { researchProductWithRealAPIs, checkRealAPIKeys } from '@/lib/real-marketplace-search'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const resolvedParams = await params
    
    // Use demo user directly (no authentication required)
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    console.log('🚀 [MARKET_RESEARCH] Starting AI research for product:', resolvedParams.id)

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, model, brand, category, status')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log(`🔍 [MARKET_RESEARCH] Researching: ${product.name}`)

    // Check which APIs are available
    const apiStatus = checkRealAPIKeys()
    const useRealAPIs = apiStatus.available.length > 0

    let researchResults
    let urlType = 'fake'

    if (useRealAPIs) {
      console.log(`🌐 [MARKET_RESEARCH] Using REAL APIs:`, apiStatus.available)
      // Use real marketplace APIs for working URLs
      researchResults = await researchProductWithRealAPIs(
        product.name || 'Unknown Product',
        product.model,
        product.brand,
        product.category
      )
      urlType = 'real'
    } else {
      console.log(`⚠️ [MARKET_RESEARCH] No real APIs available - using AI (FAKE URLs)`)
      console.log(`💡 [MARKET_RESEARCH] To get REAL URLs, add API keys:`, apiStatus.recommendations)
      
      // Fallback to AI (generates fake URLs)
      researchResults = await researchProductWithAI(
        product.name || 'Unknown Product',
        product.model,
        product.brand,
        product.category
      )
    }

    console.log(`📊 [MARKET_RESEARCH] Research completed with ${researchResults.amazonResults.length} Amazon + ${researchResults.ebayResults.length} eBay results (URLs: ${urlType})`)

    // Save results to database
    await saveMarketResearchToDatabase(resolvedParams.id, researchResults, supabase)

    // Update product status to show research was completed
    await supabase
      .from('products')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    return NextResponse.json({
      success: true,
      message: `Market research completed successfully using ${urlType.toUpperCase()} APIs`,
      urlType: urlType, // 'real' or 'fake'
      warning: urlType === 'fake' ? 'URLs are AI-generated and may not work. Add real API keys for working URLs.' : null,
      data: {
        productName: researchResults.productName,
        amazonResults: researchResults.amazonResults.length,
        ebayResults: researchResults.ebayResults.length,
        averagePrice: researchResults.averagePrice,
        priceRange: researchResults.priceRange,
        marketDemand: researchResults.marketDemand,
        confidence: researchResults.confidence,
        insights: researchResults.aiInsights,
        sampleUrls: {
          amazon: researchResults.amazonResults[0]?.link || null,
          ebay: researchResults.ebayResults[0]?.link || null
        }
      },
      apiStatus: {
        available: apiStatus.available,
        missing: apiStatus.missing,
        recommendations: urlType === 'fake' ? apiStatus.recommendations : []
      }
    })

  } catch (error) {
    console.error('❌ [MARKET_RESEARCH] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Market research failed',
      message: 'Failed to complete market research. Please try again.'
    }, { 
      status: 500 
    })
  }
}

// Get existing market research data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createServerClient()
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    
    console.log('📖 [MARKET_RESEARCH] Fetching research data for product:', resolvedParams.id)

    // Get existing market research data
    const { data: researchData, error } = await supabase
      .from('market_research_data')
      .select('*')
      .eq('product_id', resolvedParams.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch research data: ${error.message}`)
    }

    if (!researchData) {
      return NextResponse.json({
        hasData: false,
        message: 'No market research data available for this product'
      })
    }

    // Transform data for frontend
    const transformedData = {
      hasData: true,
      productId: resolvedParams.id,
      
      // Amazon data
      amazon: {
        price: researchData.amazon_price,
        link: researchData.amazon_link,
        status: researchData.amazon_url_status,
        lastChecked: researchData.amazon_last_checked
      },
      
      // eBay data
      ebay: {
        price: researchData.ebay_price,
        link: researchData.ebay_link,
        condition: researchData.ebay_condition,
        sellerRating: researchData.ebay_seller_rating,
        soldCount: researchData.ebay_sold_count,
        status: researchData.ebay_url_status,
        lastChecked: researchData.ebay_last_checked
      },
      
      // Market analysis
      market: {
        averagePrice: researchData.average_market_price,
        priceRange: {
          min: researchData.price_range_min,
          max: researchData.price_range_max
        },
        competitivePrice: researchData.competitive_price,
        marketDemand: researchData.market_demand,
        competitorCount: researchData.competitor_count,
        aiConfidence: researchData.ai_confidence,
        searchKeywords: researchData.search_keywords,
        trendingScore: researchData.trending_score
      },
      
      // Additional marketplace data
      marketplaceUrls: researchData.marketplace_urls,
      researchSources: researchData.research_sources,
      lastUpdated: researchData.updated_at,
      researchedAt: researchData.created_at
    }

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('❌ [MARKET_RESEARCH] Get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch research data' },
      { status: 500 }
    )
  }
} 