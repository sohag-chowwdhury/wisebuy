// app/api/test-real-marketplace/route.ts - Test Real Marketplace APIs
import { NextRequest, NextResponse } from 'next/server'
import { researchProductWithRealAPIs, checkRealAPIKeys } from '@/lib/real-marketplace-search'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST_REAL] Testing real marketplace APIs...')

    // Check API key status
    const apiStatus = checkRealAPIKeys()
    
    if (apiStatus.available.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No real API keys configured',
        message: 'You need to add real marketplace API keys to get working URLs',
        apiStatus,
        setup_instructions: [
          '1. Get SerpAPI key: https://serpapi.com/ (100 free searches/month)',
          '2. Get eBay API key: https://developer.ebay.com/ (Free tier)',
          '3. Get RapidAPI key: https://rapidapi.com/ (Multiple APIs)',
          '4. Add keys to your .env.local:',
          '   SERP_API_KEY=your_serpapi_key',
          '   EBAY_API_KEY=your_ebay_key', 
          '   RAPIDAPI_KEY=your_rapidapi_key'
        ]
      }, { status: 400 })
    }

    console.log(`🌐 [TEST_REAL] Using real APIs:`, apiStatus.available)

    // Test with a common product
    const testProduct = 'Apple iPhone 13'
    const testModel = 'iPhone 13 128GB'
    const testBrand = 'Apple'
    const testCategory = 'Electronics'

    console.log(`🔍 [TEST_REAL] Searching for: ${testProduct}`)

    const startTime = Date.now()
    const results = await researchProductWithRealAPIs(
      testProduct,
      testModel,
      testBrand,
      testCategory
    )
    const duration = Date.now() - startTime

    // Validate URLs are real (not AI-generated patterns)
    const validateUrl = (url: string, platform: string): boolean => {
      if (platform === 'amazon') {
        // Real Amazon URLs: amazon.com/dp/ASIN or amazon.com/gp/product/ASIN
        return url.includes('amazon.com') && (url.includes('/dp/') || url.includes('/gp/product/'))
      } else if (platform === 'ebay') {
        // Real eBay URLs: ebay.com/itm/ITEM_ID (with real item IDs being 10+ digits)
        const match = url.match(/ebay\.com\/itm\/(\d+)/)
        return match !== null && match[1].length >= 10 // Real eBay item IDs are long
      }
      return false
    }

    // Check URL validity
    const amazonValidUrls = results.amazonResults.filter(r => validateUrl(r.link, 'amazon')).length
    const ebayValidUrls = results.ebayResults.filter(r => validateUrl(r.link, 'ebay')).length
    const totalResults = results.amazonResults.length + results.ebayResults.length
    const totalValidUrls = amazonValidUrls + ebayValidUrls

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      testProduct,
      apiStatus,
      results: {
        // Overall stats
        totalResults,
        totalValidUrls,
        urlValidityRate: totalResults > 0 ? ((totalValidUrls / totalResults) * 100).toFixed(1) + '%' : '0%',
        
        // Amazon results
        amazon: {
          found: results.amazonResults.length,
          validUrls: amazonValidUrls,
          sampleResult: results.amazonResults[0] || null,
          urlPattern: results.amazonResults[0]?.link ? 'Real Amazon URL detected' : 'No Amazon results'
        },
        
        // eBay results
        ebay: {
          found: results.ebayResults.length,
          validUrls: ebayValidUrls,
          sampleResult: results.ebayResults[0] || null,
          urlPattern: results.ebayResults[0]?.link ? 'Real eBay URL detected' : 'No eBay results'
        },
        
        // Market analysis
        market: {
          averagePrice: results.averagePrice,
          priceRange: results.priceRange,
          marketDemand: results.marketDemand,
          confidence: results.confidence,
          insights: results.aiInsights
        }
      },
      message: totalValidUrls > 0 
        ? `✅ SUCCESS: Found ${totalValidUrls} real working URLs out of ${totalResults} results`
        : `⚠️ WARNING: Found ${totalResults} results but no valid URLs. Check your API keys.`,
      nextSteps: totalValidUrls > 0 ? [
        'Your real marketplace APIs are working!',
        'All future research will use these real APIs',
        'URLs in your database will be clickable and working'
      ] : [
        'Check your API key configuration',
        'Verify API keys have sufficient credits', 
        'Test individual API endpoints'
      ]
    })

  } catch (error) {
    console.error('❌ [TEST_REAL] Real marketplace test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      message: 'Real marketplace API test failed',
      troubleshooting: [
        'Check your API keys are correctly set in .env.local',
        'Verify API keys have sufficient credits/quotas',
        'Check network connectivity',
        'Ensure API endpoints are accessible'
      ]
    }, { status: 500 })
  }
}

// POST endpoint to test specific API keys
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testApiKey, apiType } = body

    if (!testApiKey || !apiType) {
      return NextResponse.json({
        success: false,
        error: 'testApiKey and apiType are required',
        message: 'Provide testApiKey and apiType (serp, ebay, or rapidapi) to test'
      }, { status: 400 })
    }

    console.log(`🧪 [TEST_REAL] Testing specific API: ${apiType}`)

    let testResult
    const testKeywords = ['iPhone 13']

    switch (apiType) {
      case 'serp':
        const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=iPhone%2013%20site:amazon.com&api_key=${testApiKey}&num=2`
        const serpResponse = await fetch(serpUrl)
        testResult = {
          status: serpResponse.status,
          ok: serpResponse.ok,
          data: serpResponse.ok ? await serpResponse.json() : await serpResponse.text()
        }
        break
        
      case 'ebay':
        const ebayUrl = `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${testApiKey}&RESPONSE-DATA-FORMAT=JSON&keywords=iPhone%2013&paginationInput.entriesPerPage=2`
        const ebayResponse = await fetch(ebayUrl)
        testResult = {
          status: ebayResponse.status,
          ok: ebayResponse.ok,
          data: ebayResponse.ok ? await ebayResponse.json() : await ebayResponse.text()
        }
        break
        
      case 'rapidapi':
        const rapidResponse = await fetch('https://amazon-price-finder.p.rapidapi.com/search', {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': testApiKey,
            'X-RapidAPI-Host': 'amazon-price-finder.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ keyword: 'iPhone 13', country: 'US' })
        })
        testResult = {
          status: rapidResponse.status,
          ok: rapidResponse.ok,
          data: rapidResponse.ok ? await rapidResponse.json() : await rapidResponse.text()
        }
        break
        
      default:
        throw new Error(`Unknown API type: ${apiType}`)
    }

    return NextResponse.json({
      success: testResult.ok,
      apiType,
      testResult,
      message: testResult.ok 
        ? `✅ ${apiType.toUpperCase()} API key is working!`
        : `❌ ${apiType.toUpperCase()} API key failed: ${testResult.status}`
    })

  } catch (error) {
    console.error('❌ [TEST_REAL] API key test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API key test failed'
    }, { status: 500 })
  }
} 