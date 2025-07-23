// app/api/demo-fake-vs-real-urls/route.ts - Demo Fake vs Real URLs
import { NextRequest, NextResponse } from 'next/server'
import { researchProductWithAI } from '@/lib/ai-market-research'
import { researchProductWithRealAPIs, checkRealAPIKeys } from '@/lib/real-marketplace-search'

export async function GET(_request: NextRequest) {
  try {
    console.log('🎭 [DEMO] Running fake vs real URL comparison...')

    const testProduct = 'Apple iPhone 13 Pro'
    const testModel = 'iPhone 13 Pro 128GB'
    const testBrand = 'Apple'
    const testCategory = 'Electronics'

    // Check API status
    const apiStatus = checkRealAPIKeys()
    const hasRealApis = apiStatus.available.length > 0

    // Get fake URLs from AI
    console.log('🤖 [DEMO] Getting FAKE URLs from AI...')
    const fakeResults = await researchProductWithAI(testProduct, testModel, testBrand, testCategory)

    let realResults = null
    if (hasRealApis) {
      console.log('🌐 [DEMO] Getting REAL URLs from APIs...')
      realResults = await researchProductWithRealAPIs(testProduct, testModel, testBrand, testCategory)
    }

    // Analyze URL patterns
    const analyzeFakeUrls = (results: any): string[] => {
      const patterns: string[] = []
      
      results.amazonResults.forEach((item: any) => {
        if (item.link.includes('amazon.com/dp/B')) {
          const asin = item.link.split('/dp/')[1]?.substring(0, 10)
          patterns.push(`Amazon ASIN: ${asin} (AI generated - likely fake)`)
        }
      })
      
      results.ebayResults.forEach((item: any) => {
        if (item.link.includes('ebay.com/itm/')) {
          const itemId = item.link.split('/itm/')[1]?.split('?')[0]
          patterns.push(`eBay ID: ${itemId} (AI generated - likely fake)`)
        }
      })
      
      return patterns
    }

    const analyzeRealUrls = (results: any): string[] => {
      const patterns: string[] = []
      
      results.amazonResults.forEach((item: any) => {
        patterns.push(`Amazon: ${item.link} (API verified - real)`)
      })
      
      results.ebayResults.forEach((item: any) => {
        patterns.push(`eBay: ${item.link} (API verified - real)`)
      })
      
      return patterns
    }

    return NextResponse.json({
      success: true,
      demo: {
        testProduct,
        timestamp: new Date().toISOString(),
        
        // Fake AI Results
        fakeUrls: {
          type: 'AI Generated (FAKE)',
          warning: '❌ These URLs look real but DON\'T WORK when clicked',
          amazonResults: fakeResults.amazonResults.length,
          ebayResults: fakeResults.ebayResults.length,
          sampleUrls: {
            amazon: fakeResults.amazonResults[0]?.link || 'No Amazon results',
            ebay: fakeResults.ebayResults[0]?.link || 'No eBay results'
          },
          urlPatterns: analyzeFakeUrls(fakeResults),
          confidence: fakeResults.confidence,
          analysis: 'AI models hallucinate realistic URLs that don\'t actually exist'
        },
        
        // Real API Results (if available)
        realUrls: hasRealApis ? {
          type: 'API Generated (REAL)',
          success: '✅ These URLs are verified and WORK when clicked',
          amazonResults: realResults?.amazonResults.length || 0,
          ebayResults: realResults?.ebayResults.length || 0,
          sampleUrls: {
            amazon: realResults?.amazonResults[0]?.link || 'No Amazon results',
            ebay: realResults?.ebayResults[0]?.link || 'No eBay results'
          },
          urlPatterns: analyzeRealUrls(realResults),
          confidence: realResults?.confidence || 0,
          analysis: 'Real marketplace APIs return current, working URLs'
        } : {
          type: 'Not Available',
          message: 'Add API keys to see real URLs',
          setupNeeded: apiStatus.recommendations
        }
      },
      
      comparison: {
        fakeVsReal: hasRealApis ? 'Both available for comparison' : 'Only fake URLs available',
        recommendation: hasRealApis 
          ? 'Your system will use REAL APIs automatically' 
          : 'Add marketplace API keys to get working URLs',
        impact: {
          withoutApis: 'Users get fake URLs that don\'t work → Poor experience',
          withApis: 'Users get real URLs that work → Great experience'
        }
      },
      
      apiStatus: {
        configured: apiStatus.available,
        missing: apiStatus.missing,
        recommendations: apiStatus.recommendations
      },
      
      nextSteps: hasRealApis ? [
        '✅ Your real APIs are working!',
        '✅ All future research will use real URLs',
        '✅ Users will get clickable, working links',
        '✅ Market data will be current and accurate'
      ] : [
        '1. Choose an API: SerpAPI (easiest) or eBay API (free)',
        '2. Get API key from provider',
        '3. Add to .env.local: SERP_API_KEY=your_key',
        '4. Restart server',
        '5. Test: GET /api/test-real-marketplace'
      ]
    })

  } catch (error) {
    console.error('❌ [DEMO] Demo comparison failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Demo failed',
      message: 'Could not run fake vs real URL comparison'
    }, { status: 500 })
  }
} 