// lib/background/processor.ts
import { createServerClient } from '../supabase/client'
import { Database } from '../supabase/types'

type BackgroundJob = Database['public']['Tables']['background_jobs']['Row']
type PipelinePhase = Database['public']['Tables']['pipeline_phases']['Row']

export class BackgroundProcessor {
  private supabase = createServerClient()
  private isRunning = false
  private workerId = `worker-${Math.random().toString(36).substr(2, 9)}`

  async start() {
    if (this.isRunning) return
    this.isRunning = true
    
    console.log(`🚀 Background processor started with worker ID: ${this.workerId}`)
    
    // Process jobs every 2 seconds
    const processInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(processInterval)
        return
      }
      
      try {
        await this.processNextJob()
      } catch (error) {
        console.error('❌ Error processing job:', error)
      }
    }, 2000)
  }

  stop() {
    this.isRunning = false
    console.log(`🛑 Background processor stopped: ${this.workerId}`)
  }

  private async processNextJob() {
    // Get next pending job with highest priority
    const { data: job, error } = await this.supabase
      .from('background_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error || !job) return

    // Claim the job
    const { error: updateError } = await this.supabase
      .from('background_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        worker_id: this.workerId
      })
      .eq('id', job.id)
      .eq('status', 'pending') // Ensure it's still pending

    if (updateError) return

    console.log(`📋 Processing job: ${job.job_type} for product: ${job.product_id}`)

    try {
      await this.executeJob(job)
      
      // Mark job as completed
      await this.supabase
        .from('background_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error)
      
      const retryCount = job.retry_count + 1
      const shouldRetry = retryCount < job.max_retries

      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s...
        const scheduledAt = new Date(Date.now() + retryDelay).toISOString()

        await this.supabase
          .from('background_jobs')
          .update({
            status: 'pending',
            retry_count: retryCount,
            scheduled_at: scheduledAt,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            started_at: null,
            worker_id: null
          })
          .eq('id', job.id)
      } else {
        // Mark as failed
        await this.supabase
          .from('background_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id)
      }
    }
  }

  private async executeJob(job: BackgroundJob) {
    switch (job.job_type) {
      case 'phase_1':
        return this.processPhase1(job)
      case 'phase_2':
        return this.processPhase2(job)
      case 'phase_3':
        return this.processPhase3(job)
      case 'phase_4':
        return this.processPhase4(job)
      default:
        throw new Error(`Unknown job type: ${job.job_type}`)
    }
  }

  private async processPhase1(job: BackgroundJob) {
    const { product_id, payload } = job
    if (!product_id) throw new Error('Product ID required for phase 1')

    // Get product and images
    const { data: product } = await this.supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', product_id)
      .single()

    if (!product) throw new Error('Product not found')

    // Simulate AI product recognition
    await this.delay(3000) // Simulate processing time

    // Mock AI results
    const mockResults = {
      productName: product.name || 'Unidentified Product',
      model: product.model || 'Unknown Model',
      brand: this.extractBrand(product.name || ''),
      category: this.categorizeProduct(product.name || ''),
      confidence: Math.floor(Math.random() * 20) + 80, // 80-99%
      condition: 'good' as const,
      conditionDetails: 'Minor wear consistent with normal use. All functions working properly.',
      identifiedFeatures: [
        'Original packaging',
        'All accessories included',
        'No visible damage'
      ]
    }

    // Update product with Phase 1 results
    await this.supabase
      .from('products')
      .update({
        name: mockResults.productName,
        model: mockResults.model,
        brand: mockResults.brand,
        category: mockResults.category,
        ai_confidence: mockResults.confidence,
        condition: mockResults.condition,
        condition_details: mockResults.conditionDetails,
        identified_features: mockResults.identifiedFeatures
      })
      .eq('id', product_id)

    // Complete the phase
    await this.supabase.rpc('complete_phase', {
      p_phase_id: payload.phase_id,
      p_output_data: mockResults
    })

    console.log(`✅ Phase 1 completed for product: ${product_id}`)
  }

  private async processPhase2(job: BackgroundJob) {
    const { product_id, payload } = job
    if (!product_id) throw new Error('Product ID required for phase 2')

    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (!product) throw new Error('Product not found')

    // Simulate market research
    await this.delay(4000)

    const mockMarketData = {
      msrp: this.generatePrice(500, 2000),
      amazonPrice: this.generatePrice(400, 1800),
      amazonLink: `https://amazon.com/dp/${Math.random().toString(36).substr(2, 10)}`,
      competitivePrice: this.generatePrice(350, 1600),
      specifications: {
        brand: product.brand || 'Unknown',
        category: product.category || 'Electronics',
        year: '2023',
        weight: `${Math.floor(Math.random() * 2000)} g`,
        dimensions: `${Math.floor(Math.random() * 20)} x ${Math.floor(Math.random() * 15)} x ${Math.floor(Math.random() * 5)} cm`
      }
    }

    await this.supabase
      .from('products')
      .update({
        msrp: mockMarketData.msrp,
        amazon_price: mockMarketData.amazonPrice,
        amazon_link: mockMarketData.amazonLink,
        competitive_price: mockMarketData.competitivePrice,
        specifications: mockMarketData.specifications,
        market_research: mockMarketData
      })
      .eq('id', product_id)

    await this.supabase.rpc('complete_phase', {
      p_phase_id: payload.phase_id,
      p_output_data: mockMarketData
    })

    console.log(`✅ Phase 2 completed for product: ${product_id}`)
  }

  private async processPhase3(job: BackgroundJob) {
    const { product_id, payload } = job
    if (!product_id) throw new Error('Product ID required for phase 3')

    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (!product) throw new Error('Product not found')

    // Simulate pricing calculation and content generation
    await this.delay(3500)

    const conditionMultiplier = {
      'new': 0.95,
      'like_new': 0.85,
      'good': 0.75,
      'fair': 0.60,
      'poor': 0.45
    }[product.condition || 'good'] || 0.75

    const suggestedPrice = Math.floor((product.msrp || 500) * conditionMultiplier)
    
    const mockContentData = {
      suggestedPrice,
      description: this.generateDescription(product),
      shortDescription: this.generateShortDescription(product),
      keyFeatures: this.generateKeyFeatures(product)
    }

    await this.supabase
      .from('products')
      .update({
        suggested_price: mockContentData.suggestedPrice,
        final_price: mockContentData.suggestedPrice,
        description: mockContentData.description,
        short_description: mockContentData.shortDescription,
        key_features: mockContentData.keyFeatures
      })
      .eq('id', product_id)

    await this.supabase.rpc('complete_phase', {
      p_phase_id: payload.phase_id,
      p_output_data: mockContentData
    })

    console.log(`✅ Phase 3 completed for product: ${product_id}`)
  }

/**
 * FIXED Phase 4 Processor - SEO & Publishing
 * This fixes the issue where SEO data wasn't being saved to the database
 */

// Add this method to your existing background processor class:

private async processPhase4(job: BackgroundJob) {
  const { product_id, payload } = job
  if (!product_id) throw new Error('Product ID required for phase 4')

  console.log(`🚀 [PHASE-4] Starting SEO optimization for ${product_id}`)

  // Get product data with all related information
  const { data: product } = await this.supabase
    .from('products')
    .select(`
      *,
      product_analysis_data(*),
      product_market_data(*),
      product_listings(*)
    `)
    .eq('id', product_id)
    .single()

  if (!product) throw new Error('Product not found')

  // Simulate SEO optimization processing
  await this.delay(2500)

  // Generate comprehensive SEO data
  const seoData = {
    seoTitle: this.generateSEOTitle(product),
    metaDescription: this.generateMetaDescription(product),
    urlSlug: this.generateUrlSlug(product),
    keywords: this.generateKeywords(product),
    tags: this.generateTags(product),
    seoScore: Math.floor(Math.random() * 20) + 80, // 80-100
    keywordDensity: +(Math.random() * 3 + 1).toFixed(2), // 1-4%
    readabilityScore: Math.floor(Math.random() * 20) + 75, // 75-95
    optimizedTitle: this.generateOptimizedTitle(product),
    optimizedDescription: this.generateOptimizedDescription(product),
    contentSuggestions: this.generateContentSuggestions(product),
    canonicalUrl: this.generateCanonicalUrl(product),
    robotsMeta: 'index,follow',
    schemaMarkup: this.generateSchemaMarkup(product),
    ogTitle: this.generateOGTitle(product),
    ogDescription: this.generateOGDescription(product),
    twitterTitle: this.generateTwitterTitle(product),
    twitterDescription: this.generateTwitterDescription(product),
    targetKeywords: this.generateTargetKeywords(product),
    competitorAnalysis: this.generateCompetitorAnalysis(product),
    searchVolumeData: this.generateSearchVolumeData(product)
  }

  try {
    // 1. Save to dedicated SEO analysis table
    const { data: seoRecord, error: seoError } = await this.supabase
      .from('seo_analysis_data')
      .insert({
        product_id: product_id,
        seo_title: seoData.seoTitle,
        meta_description: seoData.metaDescription,
        url_slug: seoData.urlSlug,
        keywords: seoData.keywords,
        tags: seoData.tags,
        seo_score: seoData.seoScore,
        keyword_density: seoData.keywordDensity,
        readability_score: seoData.readabilityScore,
        optimized_title: seoData.optimizedTitle,
        optimized_description: seoData.optimizedDescription,
        content_suggestions: seoData.contentSuggestions,
        canonical_url: seoData.canonicalUrl,
        robots_meta: seoData.robotsMeta,
        schema_markup: seoData.schemaMarkup,
        og_title: seoData.ogTitle,
        og_description: seoData.ogDescription,
        twitter_title: seoData.twitterTitle,
        twitter_description: seoData.twitterDescription,
        target_keywords: seoData.targetKeywords,
        competitor_analysis: seoData.competitorAnalysis,
        search_volume_data: seoData.searchVolumeData
      })
      .select()
      .single()

    if (seoError) {
      // If insert fails due to conflict, try update instead
      if (seoError.code === '23505') { // Unique constraint violation
        console.log(`🔄 [PHASE-4] SEO record exists, updating for ${product_id}`)
        const { error: updateError } = await this.supabase
          .from('seo_analysis_data')
          .update({
            seo_title: seoData.seoTitle,
            meta_description: seoData.metaDescription,
            url_slug: seoData.urlSlug,
            keywords: seoData.keywords,
            tags: seoData.tags,
            seo_score: seoData.seoScore,
            keyword_density: seoData.keywordDensity,
            readability_score: seoData.readabilityScore,
            optimized_title: seoData.optimizedTitle,
            optimized_description: seoData.optimizedDescription,
            content_suggestions: seoData.contentSuggestions,
            canonical_url: seoData.canonicalUrl,
            robots_meta: seoData.robotsMeta,
            schema_markup: seoData.schemaMarkup,
            og_title: seoData.ogTitle,
            og_description: seoData.ogDescription,
            twitter_title: seoData.twitterTitle,
            twitter_description: seoData.twitterDescription,
            target_keywords: seoData.targetKeywords,
            competitor_analysis: seoData.competitorAnalysis,
            search_volume_data: seoData.searchVolumeData,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', product_id)

        if (updateError) throw updateError
      } else {
        throw seoError
      }
    }

    console.log(`✅ [PHASE-4] SEO data saved to seo_analysis_data table for ${product_id}`)

    // 2. Also update products table with basic SEO fields for quick access
    const { error: productUpdateError } = await this.supabase
      .from('products')
      .update({
        seo_title: seoData.seoTitle,
        meta_description: seoData.metaDescription,
        url_slug: seoData.urlSlug,
        keywords: seoData.keywords,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (productUpdateError) {
      console.warn(`⚠️ [PHASE-4] Failed to update products table with SEO data:`, productUpdateError)
      // Don't throw error here as the main SEO data is already saved
    } else {
      console.log(`✅ [PHASE-4] Products table updated with SEO summary for ${product_id}`)
    }

    // 3. Complete the phase using the RPC function
    const { error: completeError } = await this.supabase.rpc('complete_phase', {
      p_phase_id: payload.phase_id,
      p_output_data: {
        seo_analysis_id: seoRecord?.id,
        seo_score: seoData.seoScore,
        keywords_count: seoData.keywords.length,
        tags_count: seoData.tags.length,
        optimization_status: 'completed'
      }
    })

    if (completeError) {
      console.warn(`⚠️ [PHASE-4] Failed to complete phase via RPC:`, completeError)
    }

    console.log(`✅ [PHASE-4] SEO optimization completed for product: ${product_id}`)

  } catch (error) {
    console.error(`❌ [PHASE-4] Error saving SEO data for ${product_id}:`, error)
    throw error
  }
}

// Enhanced SEO generation methods:

private generateSEOTitle(product: any): string {
  const name = product.name || 'Product'
  const condition = product.item_condition || 'good'
  const model = product.model ? ` ${product.model}` : ''
  return `${name}${model} - ${this.capitalizeFirst(condition)} Condition | Best Price Online`
}

private generateMetaDescription(product: any): string {
  const name = product.name || 'this product'
  const condition = product.item_condition || 'good'
  const price = product.final_price || product.suggested_price
  const priceText = price ? ` Starting at $${price}.` : ''
  return `Buy ${name} in ${condition} condition.${priceText} Fast shipping, money-back guarantee. Shop now for the best deals!`
}

private generateUrlSlug(product: any): string {
  const name = product.name || 'product'
  const model = product.model || ''
  const fullName = `${name} ${model}`.trim()
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50) // Limit length
}

private generateKeywords(product: any): string[] {
  const keywords = []
  const name = product.name || ''
  const model = product.model || ''
  const brand = product.detected_brands?.[0] || this.extractBrand(name)
  const category = product.detected_categories?.[0] || this.categorizeProduct(name)
  const condition = product.item_condition || 'good'

  // Core keywords
  if (name) keywords.push(name.toLowerCase())
  if (model) keywords.push(model.toLowerCase())
  if (brand) keywords.push(brand.toLowerCase())
  if (category) keywords.push(category.toLowerCase())

  // Combination keywords
  if (name && condition) keywords.push(`${name.toLowerCase()} ${condition}`)
  if (brand && category) keywords.push(`${brand.toLowerCase()} ${category.toLowerCase()}`)
  if (name && model) keywords.push(`${name.toLowerCase()} ${model.toLowerCase()}`)

  // Long tail keywords
  keywords.push(`buy ${name.toLowerCase()}`)
  keywords.push(`${name.toLowerCase()} for sale`)
  keywords.push(`${condition} ${name.toLowerCase()}`)
  keywords.push(`${name.toLowerCase()} price`)
  keywords.push(`${name.toLowerCase()} deals`)

  return [...new Set(keywords)].slice(0, 15) // Remove duplicates and limit
}

private generateTags(product: any): string[] {
  const tags = []
  const category = product.detected_categories?.[0] || this.categorizeProduct(product.name || '')
  const condition = product.item_condition || 'good'
  const brand = product.detected_brands?.[0] || this.extractBrand(product.name || '')

  tags.push(category.toLowerCase())
  tags.push(condition)
  tags.push(brand.toLowerCase())
  tags.push('electronics')
  tags.push('tech')
  tags.push('gadgets')
  
  if (condition === 'excellent' || condition === 'very_good') {
    tags.push('premium')
    tags.push('high-quality')
  }
  
  tags.push('fast-shipping')
  tags.push('warranty')
  tags.push('authentic')

  return [...new Set(tags)].slice(0, 10)
}

private generateOptimizedTitle(product: any): string {
  const name = product.name || 'Product'
  const model = product.model ? ` ${product.model}` : ''
  const year = new Date().getFullYear()
  return `${name}${model} ${year} - Best Deals & Fast Shipping`
}

private generateOptimizedDescription(product: any): string {
  const name = product.name || 'this product'
  const condition = product.item_condition || 'good'
  const features = product.key_features || []
  const featuresText = features.length > 0 ? ` Key features: ${features.slice(0, 3).join(', ')}.` : ''
  
  return `Discover amazing deals on ${name} in ${condition} condition. Perfect for both personal use and gifting.${featuresText} Shop with confidence - fast shipping, secure payment, and excellent customer service guaranteed.`
}

private generateContentSuggestions(product: any): string[] {
  return [
    'Add more detailed product specifications',
    'Include high-quality product images from multiple angles',
    'Add customer reviews and testimonials',
    'Create comparison charts with similar products',
    'Include warranty and return policy information',
    'Add technical specifications and compatibility details'
  ]
}

private generateCanonicalUrl(product: any): string {
  const slug = this.generateUrlSlug(product)
  return `https://yoursite.com/products/${slug}`
}

private generateSchemaMarkup(product: any): object {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name || "Product",
    "description": product.description || product.short_description || "Quality product",
    "brand": {
      "@type": "Brand",
      "name": product.detected_brands?.[0] || "Generic"
    },
    "offers": {
      "@type": "Offer",
      "price": product.final_price || product.suggested_price || "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "condition": `https://schema.org/${this.mapConditionToSchema(product.item_condition)}`
    }
  }
}

private generateOGTitle(product: any): string {
  return `${product.name || 'Product'} - Great Deal Available Now!`
}

private generateOGDescription(product: any): string {
  return `Get ${product.name || 'this product'} in ${product.item_condition || 'good'} condition. Fast shipping and great prices!`
}

private generateTwitterTitle(product: any): string {
  return `🔥 ${product.name || 'Amazing Product'} Deal Alert!`
}

private generateTwitterDescription(product: any): string {
  return `Don't miss out on this ${product.name || 'product'} in ${product.item_condition || 'good'} condition. Limited time offer! #deals #tech`
}

private generateTargetKeywords(product: any): string[] {
  return this.generateKeywords(product).slice(0, 5) // Top 5 most important
}

private generateCompetitorAnalysis(product: any): object {
  return {
    "competitors_found": Math.floor(Math.random() * 10) + 5,
    "avg_competitor_price": (product.final_price || 250) * (1 + Math.random() * 0.3),
    "price_advantage": "15% below market average",
    "unique_selling_points": [
      "Better condition",
      "Faster shipping",
      "Better customer service"
    ]
  }
}

private generateSearchVolumeData(product: any): object {
  return {
    "primary_keyword_volume": Math.floor(Math.random() * 5000) + 1000,
    "secondary_keywords": {
      [`${product.name} ${product.item_condition}`]: Math.floor(Math.random() * 1000) + 100,
      [`buy ${product.name}`]: Math.floor(Math.random() * 2000) + 500
    },
    "trend": "stable",
    "difficulty": Math.floor(Math.random() * 30) + 20
  }
}

private mapConditionToSchema(condition: string): string {
  const mapping: Record<string, string> = {
    'excellent': 'NewCondition',
    'very_good': 'RefurbishedCondition', 
    'good': 'UsedCondition',
    'fair': 'UsedCondition',
    'poor': 'DamagedCondition',
    'for_parts': 'DamagedCondition'
  }
  return mapping[condition] || 'UsedCondition'
}

private capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
  // Helper methods
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private extractBrand(productName: string): string {
    const brands = ['Apple', 'Samsung', 'Sony', 'Microsoft', 'Nintendo', 'Canon', 'Nikon']
    for (const brand of brands) {
      if (productName.toLowerCase().includes(brand.toLowerCase())) {
        return brand
      }
    }
    return 'Generic'
  }

  private categorizeProduct(productName: string): string {
    const name = productName.toLowerCase()
    if (name.includes('phone') || name.includes('iphone') || name.includes('galaxy')) return 'Smartphone'
    if (name.includes('laptop') || name.includes('macbook') || name.includes('computer')) return 'Laptop'
    if (name.includes('camera') || name.includes('canon') || name.includes('nikon')) return 'Camera'
    if (name.includes('headphone') || name.includes('earphone') || name.includes('audio')) return 'Audio'
    if (name.includes('game') || name.includes('console') || name.includes('nintendo')) return 'Gaming'
    return 'Electronics'
  }

  private generatePrice(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
  }

  private generateDescription(product: any): string {
    return `${product.name || 'Product'} in ${product.condition || 'good'} condition. ${product.condition_details || 'Well-maintained item with normal signs of use.'} Perfect for everyday use or as a replacement device. Includes original specifications: ${Object.entries(product.specifications || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}.`
  }

  private generateShortDescription(product: any): string {
    return `${product.name || 'Product'} - ${product.condition || 'Good'} condition, fully functional. Great value for money.`
  }

  private generateKeyFeatures(product: any): string[] {
    return [
      `${product.condition || 'Good'} condition`,
      'Fully tested and working',
      'Fast shipping',
      'Money-back guarantee',
      'Original specifications maintained'
    ]
  }

  private generateSEOTitle(product: any): string {
    return `${product.name || 'Product'} - ${product.condition || 'Good'} Condition | Best Price`
  }

  private generateMetaDescription(product: any): string {
    return `Buy ${product.name || 'this product'} in ${product.condition || 'good'} condition. ${product.short_description || 'Great value for money.'} Free shipping available.`
  }

  private generateUrlSlug(product: any): string {
    return (product.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private generateKeywords(product: any): string[] {
    const base = [
      product.brand || 'electronics',
      product.category || 'gadget',
      product.condition || 'used',
      'buy online',
      'best price'
    ]
    return base.filter(Boolean)
  }
}

// Create global processor instance
export const backgroundProcessor = new BackgroundProcessor()

// lib/background/init.ts
import { backgroundProcessor } from './processor'

// Initialize background processing (call this in your API route or server)
export function initializeBackgroundProcessing() {
  // Start the processor if it's not already running
  backgroundProcessor.start()
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, stopping background processor...')
    backgroundProcessor.stop()
    process.exit(0)
  })
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, stopping background processor...')
    backgroundProcessor.stop()
    process.exit(0)
  })
}
