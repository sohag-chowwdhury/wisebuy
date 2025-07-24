// Real Marketplace Search Service
// Integrates with actual APIs to find authentic product URLs

interface MarketplaceConfig {
  serpApiKey?: string;
  amazonApiKey?: string; 
  ebayApiKey?: string;
  rapidApiKey?: string;
}

interface SearchResult {
  platform: string;
  title: string;
  price: number;
  url: string;
  verified: boolean;
  confidence: number;
  seller_rating?: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  last_updated: string;
}

export class MarketplaceSearchService {
  private config: MarketplaceConfig;

  constructor(config: MarketplaceConfig = {}) {
    this.config = {
      serpApiKey: process.env.SERP_API_KEY,
      amazonApiKey: process.env.AMAZON_API_KEY,
      ebayApiKey: process.env.EBAY_API_KEY,
      rapidApiKey: process.env.RAPIDAPI_KEY,
      ...config
    };
  }

  /**
   * Search for real product listings across multiple platforms
   */
  async searchAllPlatforms(query: string, options: {
    condition?: string;
    maxResults?: number;
    platforms?: string[];
  } = {}): Promise<{ [platform: string]: SearchResult | null }> {
    const { condition = 'used', maxResults = 1, platforms = ['amazon', 'ebay'] } = options;
    
  
    
    const results: { [platform: string]: SearchResult | null } = {};
    
    // Search Amazon
    if (platforms.includes('amazon')) {
      results.amazon = await this.searchAmazon(query, condition, maxResults);
    }
    
    // Search eBay
    if (platforms.includes('ebay')) {
      results.ebay = await this.searchEbay(query, condition, maxResults);
    }
    
    // Search using SerpAPI (Google Shopping results)
    if (platforms.includes('google_shopping') && this.config.serpApiKey) {
      const googleResults = await this.searchGoogleShopping(query, condition);
      // Extract Amazon/eBay results from Google Shopping
      if (googleResults.amazon && !results.amazon) results.amazon = googleResults.amazon;
      if (googleResults.ebay && !results.ebay) results.ebay = googleResults.ebay;
    }

    return results;
  }

  /**
   * Search Amazon using real-time web search or Amazon API
   */
  private async searchAmazon(query: string, condition: string, maxResults: number): Promise<SearchResult | null> {
    try {
      // Method 1: Amazon Product Advertising API (requires approval)
      if (this.config.amazonApiKey) {
        return await this.searchAmazonPA(query, condition);
      }
      
      // Method 2: SerpAPI Google Shopping for Amazon results
      if (this.config.serpApiKey) {
        return await this.searchAmazonViaSerpAPI(query, condition);
      }
      
      // Method 3: RapidAPI Amazon search endpoints
      if (this.config.rapidApiKey) {
        return await this.searchAmazonViaRapidAPI(query, condition);
      }
      
  
      return null;
      
    } catch (error) {
      console.error('❌ [MARKETPLACE-SEARCH] Amazon search failed:', error);
      return null;
    }
  }

  /**
   * Search eBay using eBay Finding API
   */
  private async searchEbay(query: string, condition: string, maxResults: number): Promise<SearchResult | null> {
    try {
      if (!this.config.ebayApiKey) {
    
        return null;
      }

      // eBay Finding API - Free tier available
      const ebayUrl = new URL('https://svcs.ebay.com/services/search/FindingService/v1');
      ebayUrl.searchParams.append('OPERATION-NAME', 'findItemsByKeywords');
      ebayUrl.searchParams.append('SERVICE-VERSION', '1.0.0');
      ebayUrl.searchParams.append('SECURITY-APPNAME', this.config.ebayApiKey);
      ebayUrl.searchParams.append('RESPONSE-DATA-FORMAT', 'JSON');
      ebayUrl.searchParams.append('keywords', query);
      ebayUrl.searchParams.append('itemFilter(0).name', 'Condition');
      ebayUrl.searchParams.append('itemFilter(0).value', this.mapConditionToEbay(condition));
      ebayUrl.searchParams.append('paginationInput.entriesPerPage', maxResults.toString());
      ebayUrl.searchParams.append('sortOrder', 'BestMatch');

      const response = await fetch(ebayUrl.toString());
      const data = await response.json();
      
      const items = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item;
      if (!items || items.length === 0) {

        return null;
      }

      const firstItem = items[0];
      const result: SearchResult = {
        platform: 'eBay',
        title: firstItem.title[0],
        price: parseFloat(firstItem.sellingStatus[0].currentPrice[0].__value__),
        url: firstItem.viewItemURL[0],
        verified: true, // From official eBay API
        confidence: 0.95, // High confidence for API results
        seller_rating: firstItem.topRatedListing ? 5.0 : 4.0,
        availability: 'in_stock',
        last_updated: new Date().toISOString()
      };

      
      return result;

    } catch (error) {
      console.error('❌ [MARKETPLACE-SEARCH] eBay API search failed:', error);
      return null;
    }
  }

  /**
   * Search using SerpAPI for Google Shopping results
   */
  private async searchGoogleShopping(query: string, condition: string): Promise<{ amazon?: SearchResult; ebay?: SearchResult }> {
    try {
      if (!this.config.serpApiKey) {
    
        return {};
      }

      const serpUrl = new URL('https://serpapi.com/search');
      serpUrl.searchParams.append('api_key', this.config.serpApiKey);
      serpUrl.searchParams.append('engine', 'google_shopping');
      serpUrl.searchParams.append('q', `${query} ${condition}`);
      serpUrl.searchParams.append('num', '20');

      const response = await fetch(serpUrl.toString());
      const data = await response.json();
      
      const results: { amazon?: SearchResult; ebay?: SearchResult } = {};
      
      if (data.shopping_results) {
        // Look for Amazon results
        const amazonResult = data.shopping_results.find((item: any) => 
          item.link?.includes('amazon.com') && item.price
        );
        
        if (amazonResult) {
          results.amazon = {
            platform: 'Amazon',
            title: amazonResult.title,
            price: this.parsePrice(amazonResult.price),
            url: amazonResult.link,
            verified: true,
            confidence: 0.90,
            availability: 'in_stock',
            last_updated: new Date().toISOString()
          };
        }

        // Look for eBay results  
        const ebayResult = data.shopping_results.find((item: any) => 
          item.link?.includes('ebay.com') && item.price
        );
        
        if (ebayResult) {
          results.ebay = {
            platform: 'eBay',
            title: ebayResult.title,
            price: this.parsePrice(ebayResult.price),
            url: ebayResult.link,
            verified: true,
            confidence: 0.90,
            availability: 'in_stock',
            last_updated: new Date().toISOString()
          };
        }
      }

  
      return results;

    } catch (error) {
      console.error('❌ [MARKETPLACE-SEARCH] SerpAPI search failed:', error);
      return {};
    }
  }

  // Placeholder methods for other search strategies
  private async searchAmazonPA(query: string, condition: string): Promise<SearchResult | null> {
    // Amazon Product Advertising API integration
    // Requires Amazon Associates account and approval

    return null;
  }

  private async searchAmazonViaSerpAPI(query: string, condition: string): Promise<SearchResult | null> {
    // Use SerpAPI to search Amazon directly

    return null;
  }

  private async searchAmazonViaRapidAPI(query: string, condition: string): Promise<SearchResult | null> {
    // Use RapidAPI marketplace endpoints for Amazon

    return null;
  }

  // Helper methods
  private mapConditionToEbay(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      'new': 'New',
      'like_new': 'New other (see details)',
      'excellent': 'Used',
      'good': 'Used',
      'fair': 'Used',
      'poor': 'For parts or not working'
    };
    return conditionMap[condition] || 'Used';
  }

  private parsePrice(priceString: string): number {
    // Extract numeric price from various formats: "$123.45", "123.45", "$123"
    const match = priceString.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Validate that a URL is accessible and returns a real product page
   */
  async validateProductURL(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Check if page exists and is not a generic redirect
      return response.ok && !response.url.includes('redirect') && !response.url.includes('error');
    } catch (error) {
      console.error('❌ [MARKETPLACE-SEARCH] URL validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const marketplaceSearch = new MarketplaceSearchService(); 