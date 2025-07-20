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

  private async processPhase4(job: BackgroundJob) {
    const { product_id, payload } = job
    if (!product_id) throw new Error('Product ID required for phase 4')

    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (!product) throw new Error('Product not found')

    // Simulate SEO optimization
    await this.delay(2500)

    const mockSEOData = {
      seoTitle: this.generateSEOTitle(product),
      metaDescription: this.generateMetaDescription(product),
      urlSlug: this.generateUrlSlug(product),
      keywords: this.generateKeywords(product)
    }

    await this.supabase
      .from('products')
      .update({
        seo_title: mockSEOData.seoTitle,
        meta_description: mockSEOData.metaDescription,
        url_slug: mockSEOData.urlSlug,
        keywords: mockSEOData.keywords
      })
      .eq('id', product_id)

    await this.supabase.rpc('complete_phase', {
      p_phase_id: payload.phase_id,
      p_output_data: mockSEOData
    })

    console.log(`✅ Phase 4 completed for product: ${product_id}`)
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
