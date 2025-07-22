// app/api/test-market-research/route.ts - Test the AI Market Research
import { NextRequest, NextResponse } from 'next/server'
import { researchProductWithAI } from '@/lib/ai-market-research'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Starting AI market research test...')

    // Test with a common product
    const testProduct = 'Apple iPhone 13'
    const testModel = 'iPhone 13 128GB'
    const testBrand = 'Apple'
    const testCategory = 'Electronics'

    console.log(`🔍 [TEST] Researching: ${testProduct}`)

    // Run the AI research
    const startTime = Date.now()
    const results = await researchProductWithAI(
      testProduct,
      testModel, 
      testBrand,
      testCategory
    )
    const duration = Date.now() - startTime

    console.log(`✅ [TEST] Research completed in ${duration}ms`)
    console.log(`📊 [TEST] Results: ${results.amazonResults.length} Amazon + ${results.ebayResults.length} eBay listings`)

    // Return test results
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      testProduct,
      results: {
        // Search strategy
        searchKeywords: results.searchKeywords,
        
        // Amazon results
        amazonListings: results.amazonResults.length,
        amazonSample: results.amazonResults[0] || null,
        
        // eBay results  
        ebayListings: results.ebayResults.length,
        ebaySample: results.ebayResults[0] || null,
        
        // Market analysis
        averagePrice: results.averagePrice,
        priceRange: results.priceRange,
        marketDemand: results.marketDemand,
        recommendedPrice: results.recommendedPrice,
        confidence: results.confidence,
        insights: results.aiInsights,
        
        // Metadata
        competitorCount: results.competitorCount,
        researchedAt: results.researchedAt
      },
      message: `Successfully found ${results.amazonResults.length + results.ebayResults.length} total listings with ${(results.confidence * 100).toFixed(1)}% confidence`
    })

  } catch (error) {
    console.error('❌ [TEST] Market research test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      message: 'AI market research test failed. Check your API keys and configuration.',
      troubleshooting: [
        'Verify ANTHROPIC_API_KEY is set in .env.local',
        'Verify GEMINI_API_KEY is set in .env.local', 
        'Check API key credits/quotas',
        'Ensure network connectivity',
        'Check server logs for detailed error'
      ]
    }, { 
      status: 500 
    })
  }
} 