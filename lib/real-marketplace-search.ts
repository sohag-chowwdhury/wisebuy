// lib/real-marketplace-search.ts - Real Amazon & eBay Search with Working URLs
import { ProductSearchResult, MarketResearchResult } from './ai-market-research'

// Types for real marketplace APIs
interface SerpAPIResult {
  shopping_results?: Array<{
    title: string
    price: string
    source: string
    link: string
    rating?: number
    reviews?: number
  }>
}

interface eBayAPIResult {
  findItemsByKeywordsResponse?: Array<{
    searchResult?: Array<{
      item?: Array<{
        title?: Array<string>
        sellingStatus?: Array<{ currentPrice?: Array<{ __value__: string }> }>
        viewItemURL?: Array<string>
        condition?: Array<{ conditionDisplayName?: Array<string> }>
        topRatedListing?: Array<string>
      }>
    }>
  }>
}

/**
 * Search Amazon using SerpAPI (Google Shopping) - REAL URLS
 */
async function searchAmazonWithSerpAPI(keywords: string[]): Promise<ProductSearchResult[]> {
  const serpApiKey = process.env.SERP_API_KEY
  if (!serpApiKey) {
    console.warn('⚠️ [SERP] No SERP_API_KEY found - skipping real Amazon search')
    return []
  }

  try {
    console.log(`🛒 [AMAZON_REAL] Searching Amazon via SerpAPI:`, keywords[0])

    const query = encodeURIComponent(keywords[0] + ' site:amazon.com')
    const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${query}&api_key=${serpApiKey}&num=5`

    const response = await fetch(serpUrl)
    if (!response.ok) {
      throw new Error(`SerpAPI failed: ${response.status}`)
    }

    const data: SerpAPIResult = await response.json()
    const results: ProductSearchResult[] = []

    if (data.shopping_results) {
      for (const item of data.shopping_results.slice(0, 5)) {
        if (item.link && item.link.includes('amazon.com')) {
          const price = parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0')
          
          results.push({
            platform: 'amazon',
            title: item.title || 'Amazon Product',
            price: price,
            link: item.link, // REAL Amazon URL
            condition: 'new',
            confidence: 0.95 // High confidence for real API data
          })
        }
      }
    }

    console.log(`✅ [AMAZON_REAL] Found ${results.length} real Amazon results`)
    return results

  } catch (error) {
    console.error('❌ [AMAZON_REAL] SerpAPI search failed:', error)
    return []
  }
}

/**
 * Search eBay using Official eBay Finding API - REAL URLS  
 */
async function searchEbayWithAPI(keywords: string[]): Promise<ProductSearchResult[]> {
  const ebayApiKey = process.env.EBAY_API_KEY
  if (!ebayApiKey) {
    console.warn('⚠️ [EBAY] No EBAY_API_KEY found - skipping real eBay search')
    return []
  }

  try {
    console.log(`🏪 [EBAY_REAL] Searching eBay via official API:`, keywords[0])

    const query = encodeURIComponent(keywords[0])
    const ebayUrl = `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${ebayApiKey}&RESPONSE-DATA-FORMAT=JSON&keywords=${query}&paginationInput.entriesPerPage=5&itemFilter(0).name=ListingType&itemFilter(0).value=FixedPrice`

    const response = await fetch(ebayUrl)
    if (!response.ok) {
      throw new Error(`eBay API failed: ${response.status}`)
    }

    const data: eBayAPIResult = await response.json()
    const results: ProductSearchResult[] = []

    const items = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || []
    
    for (const item of items.slice(0, 5)) {
      const title = item.title?.[0] || 'eBay Product'
      const priceStr = item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'
      const price = parseFloat(priceStr)
      const url = item.viewItemURL?.[0] || ''
      const condition = item.condition?.[0]?.conditionDisplayName?.[0] || 'used'
      
      if (url && price > 0) {
        results.push({
          platform: 'ebay',
          title: title,
          price: price,
          link: url, // REAL eBay URL
          condition: condition.toLowerCase(),
          sellerRating: 4.5, // eBay API doesn't provide this easily
          confidence: 0.95 // High confidence for real API data
        })
      }
    }

    console.log(`✅ [EBAY_REAL] Found ${results.length} real eBay results`)
    return results

  } catch (error) {
    console.error('❌ [EBAY_REAL] eBay API search failed:', error)
    return []
  }
}

/**
 * Fallback: Search using RapidAPI Marketplace APIs
 */
async function searchWithRapidAPI(keywords: string[]): Promise<{ amazon: ProductSearchResult[]; ebay: ProductSearchResult[] }> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  if (!rapidApiKey) {
    console.warn('⚠️ [RAPID] No RAPIDAPI_KEY found - skipping RapidAPI search')
    return { amazon: [], ebay: [] }
  }

  try {
    console.log(`⚡ [RAPID] Searching via RapidAPI:`, keywords[0])

    // Try Amazon price finder API
    const amazonResponse = await fetch('https://amazon-price-finder.p.rapidapi.com/search', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'amazon-price-finder.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyword: keywords[0],
        country: 'US'
      })
    })

    let amazonResults: ProductSearchResult[] = []
    if (amazonResponse.ok) {
      const amazonData = await amazonResponse.json()
      if (amazonData.results) {
        amazonResults = amazonData.results.slice(0, 3).map((item: any) => ({
          platform: 'amazon' as const,
          title: item.title || 'Amazon Product',
          price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
          link: item.url || '',
          condition: 'new',
          confidence: 0.9
        })).filter((item: any) => item.link && item.price > 0)
      }
    }

    // Try eBay price finder API  
    const ebayResponse = await fetch('https://ebay-product-details.p.rapidapi.com/search', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'ebay-product-details.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: keywords[0],
        country: 'US'
      })
    })

    let ebayResults: ProductSearchResult[] = []
    if (ebayResponse.ok) {
      const ebayData = await ebayResponse.json()
      if (ebayData.items) {
        ebayResults = ebayData.items.slice(0, 3).map((item: any) => ({
          platform: 'ebay' as const,
          title: item.title || 'eBay Product',
          price: parseFloat(item.price?.value || '0'),
          link: item.itemWebUrl || '',
          condition: item.condition?.toLowerCase() || 'used',
          confidence: 0.9
        })).filter((item: any) => item.link && item.price > 0)
      }
    }

    console.log(`✅ [RAPID] Found ${amazonResults.length} Amazon + ${ebayResults.length} eBay results`)
    return { amazon: amazonResults, ebay: ebayResults }

  } catch (error) {
    console.error('❌ [RAPID] RapidAPI search failed:', error)
    return { amazon: [], ebay: [] }
  }
}

/**
 * Main function: Real marketplace research with working URLs
 */
export async function researchProductWithRealAPIs(
  productName: string,
  productModel?: string,
  brand?: string,
  category?: string
): Promise<MarketResearchResult> {
  try {
    console.log(`🔍 [REAL_SEARCH] Starting REAL marketplace research for: ${productName}`)

    // Generate search keywords
    const keywords = [
      productName,
      `${brand} ${productName}`.trim(),
      productModel || productName,
      `${productName} ${category}`.trim()
    ].filter(k => k.length > 2).slice(0, 3)

    console.log(`🎯 [REAL_SEARCH] Using keywords:`, keywords)

    // Try multiple real APIs in parallel
    const [amazonSerpResults, ebayApiResults, rapidApiResults] = await Promise.all([
      searchAmazonWithSerpAPI(keywords),
      searchEbayWithAPI(keywords), 
      searchWithRapidAPI(keywords)
    ])

    // Combine results (prefer official APIs over RapidAPI)
    const amazonResults = amazonSerpResults.length > 0 ? amazonSerpResults : rapidApiResults.amazon
    const ebayResults = ebayApiResults.length > 0 ? ebayApiResults : rapidApiResults.ebay

    // Calculate market analysis
    const allResults = [...amazonResults, ...ebayResults]
    const prices = allResults.map(r => r.price).filter(p => p > 0)
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    // Determine market demand based on result count and price variance
    let marketDemand: 'high' | 'medium' | 'low' = 'medium'
    if (allResults.length >= 8) marketDemand = 'high'
    else if (allResults.length <= 3) marketDemand = 'low'

    const confidence = allResults.length > 0 ? 0.95 : 0 // High confidence for real API data

    const result: MarketResearchResult = {
      productName,
      searchKeywords: keywords,
      amazonResults,
      ebayResults,
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      marketDemand,
      competitorCount: allResults.length,
      recommendedPrice: averagePrice > 0 ? averagePrice * 0.95 : 0,
      confidence,
      aiInsights: [
        `Found ${allResults.length} real marketplace listings`,
        `Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
        `Average market price: $${averagePrice.toFixed(2)}`,
        `Market demand appears ${marketDemand} based on listing availability`
      ],
      researchedAt: new Date().toISOString()
    }

    console.log(`✅ [REAL_SEARCH] Real research completed: ${amazonResults.length} Amazon + ${ebayResults.length} eBay results`)
    return result

  } catch (error) {
    console.error('❌ [REAL_SEARCH] Real marketplace research failed:', error)
    throw error
  }
}

// API Key status checker
export function checkRealAPIKeys(): { available: string[]; missing: string[]; recommendations: string[] } {
  const keys = {
    SERP_API_KEY: process.env.SERP_API_KEY,
    EBAY_API_KEY: process.env.EBAY_API_KEY,
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY
  }

  const available = Object.entries(keys).filter(([, value]) => !!value).map(([key]) => key)
  const missing = Object.entries(keys).filter(([, value]) => !value).map(([key]) => key)

  const recommendations = []
  if (!keys.SERP_API_KEY) {
    recommendations.push('Get SerpAPI key: https://serpapi.com/ (100 free searches/month)')
  }
  if (!keys.EBAY_API_KEY) {
    recommendations.push('Get eBay API key: https://developer.ebay.com/ (Free tier available)')
  }
  if (!keys.RAPIDAPI_KEY && !keys.SERP_API_KEY && !keys.EBAY_API_KEY) {
    recommendations.push('Get RapidAPI key: https://rapidapi.com/ (Multiple marketplace APIs)')
  }

  return { available, missing, recommendations }
} 