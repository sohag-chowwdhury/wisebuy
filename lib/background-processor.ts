// lib/background-processor.ts
import { supabase } from '@/lib/supabase/client';
// createClient import removed as it's not used

interface QueuedProduct {
  productId: string;
  phase: number;
  priority: 'high' | 'normal' | 'low';
  enqueuedAt: Date;
  retryCount: number;
}

interface ProcessingStats {
  totalProcessed: number;
  currentlyProcessing: number;
  errorCount: number;
  averageProcessingTime: number;
}

class BackgroundProcessor {
  private queue: QueuedProduct[] = [];
  private processing: Set<string> = new Set();
  private isRunning: boolean = false;
  private maxConcurrentJobs: number = 3;
  private processingInterval: NodeJS.Timeout | null = null;
  private stats: ProcessingStats = {
    totalProcessed: 0,
    currentlyProcessing: 0,
    errorCount: 0,
    averageProcessingTime: 0
  };

  constructor() {
    this.startProcessor();
  }

  /**
   * Queue a product for background processing (phases 2-4)
   */
  queueProduct(productId: string, phase: number = 2, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    // Check if already queued or processing
    if (this.processing.has(productId) || 
        this.queue.some(item => item.productId === productId && item.phase === phase)) {
      console.log(`📦 [BACKGROUND] Product ${productId} phase ${phase} already queued or processing`);
      return;
    }

    const queuedProduct: QueuedProduct = {
      productId,
      phase,
      priority,
      enqueuedAt: new Date(),
      retryCount: 0
    };

    // Insert based on priority
    if (priority === 'high') {
      this.queue.unshift(queuedProduct);
    } else {
      this.queue.push(queuedProduct);
    }

    console.log(`📦 [BACKGROUND] Queued product ${productId} for phase ${phase} (priority: ${priority})`);
    this.logQueueStatus();
  }

  /**
   * Start the background processor
   */
  private startProcessor(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 [BACKGROUND] Starting background processor...');

    // Process queue every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000);

    // Cleanup orphaned processing items every minute
    setInterval(() => {
      this.cleanupOrphanedJobs();
    }, 60000);
  }

  /**
   * Stop the background processor
   */
  stopProcessor(): void {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('⏹️ [BACKGROUND] Background processor stopped');
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.processing.size >= this.maxConcurrentJobs) {
      return;
    }

    while (this.queue.length > 0 && this.processing.size < this.maxConcurrentJobs) {
      const job = this.queue.shift();
      if (!job) continue;

      // Skip if already processing
      if (this.processing.has(job.productId)) {
        continue;
      }

      this.processing.add(job.productId);
      this.stats.currentlyProcessing = this.processing.size;

      // Process job asynchronously
      this.processJob(job).finally(() => {
        this.processing.delete(job.productId);
        this.stats.currentlyProcessing = this.processing.size;
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueuedProduct): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 [BACKGROUND] Starting phase ${job.phase} for product ${job.productId}`);

    try {
      // Update phase status to running
      await this.updatePhaseStatus(job.productId, job.phase, 'running');
      await this.logPipelineEvent(job.productId, job.phase, 'info', `Starting phase ${job.phase}`, 'start_phase');

      // Process the specific phase
      switch (job.phase) {
        case 2:
          await this.processPhase2(job.productId);
          break;
        case 3:
          await this.processPhase3(job.productId);
          break;
        case 4:
          await this.processPhase4(job.productId);
          break;
        default:
          throw new Error(`Unknown phase: ${job.phase}`);
      }

      // Complete the phase
      await this.completePhase(job.productId, job.phase);
      
      // Queue next phase if not the last one
      if (job.phase < 4) {
        this.queueProduct(job.productId, job.phase + 1, job.priority);
      } else {
        // Mark product as completed
        await this.completeProduct(job.productId);
      }

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime);
      console.log(`✅ [BACKGROUND] Completed phase ${job.phase} for product ${job.productId} in ${processingTime}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [BACKGROUND] Error in phase ${job.phase} for product ${job.productId}:`, errorMessage);

      await this.handleJobError(job, errorMessage);
      this.stats.errorCount++;
    }
  }

  /**
   * Process Phase 2: Market Research & Pricing
   */
  private async processPhase2(productId: string): Promise<void> {
    console.log(`📊 [PHASE-2] Starting market research for ${productId}`);

    // Get product data
    const { data: product } = await supabase
      .from('products')
      .select('name, model')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Simulate market research (replace with actual implementation)
    await this.simulateAsyncWork(3000);

    // Mock market research data with new fields
    const marketData = {
      average_market_price: Math.floor(Math.random() * 500) + 100,
      price_range_min: Math.floor(Math.random() * 200) + 50,
      price_range_max: Math.floor(Math.random() * 800) + 400,
      market_demand: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      competitor_count: Math.floor(Math.random() * 20) + 5,
      trending_score: Math.floor(Math.random() * 100),
      seasonal_factor: Math.random() * 2,
      
      // New required fields
      brand: product.name?.split(' ')[0] || 'Unknown',
      year: Math.floor(Math.random() * 10) + 2015, // Random year between 2015-2024
      weight: `${(Math.random() * 5 + 0.5).toFixed(1)} lbs`,
      dimensions: `${Math.floor(Math.random() * 15 + 5)} x ${Math.floor(Math.random() * 10 + 3)} x ${Math.floor(Math.random() * 8 + 2)} inches`,
      
      // Additional product specification fields
      manufacturer: product.name?.split(' ')[0] || 'Unknown',
      model_number: product.model || 'Unknown',
      color: ['Black', 'White', 'Silver', 'Gray', 'Blue'][Math.floor(Math.random() * 5)],
      material: ['Plastic', 'Metal', 'Stainless Steel', 'Aluminum', 'Mixed'][Math.floor(Math.random() * 5)],
      
      // Structured data
      weight_structured: {
        value: parseFloat((Math.random() * 5 + 0.5).toFixed(1)),
        unit: 'lbs',
        display: `${(Math.random() * 5 + 0.5).toFixed(1)} lbs`
      },
      dimensions_structured: {
        length: { value: Math.floor(Math.random() * 15 + 5), unit: 'inches' },
        width: { value: Math.floor(Math.random() * 10 + 3), unit: 'inches' },
        height: { value: Math.floor(Math.random() * 8 + 2), unit: 'inches' }
      },
      specifications: {
        features: ['High Quality', 'Durable', 'Easy to Use'],
        warranty: '1 year',
        condition: 'Good'
      }
    };

    // Save market research data
    await supabase
      .from('product_market_data')
      .insert({
        product_id: productId,
        ...marketData
      });

    await this.logPipelineEvent(productId, 2, 'info', 'Market research completed', 'data_saved');
  }

  /**
   * Process Phase 3: Listing Generation
   */
  private async processPhase3(productId: string): Promise<void> {
    console.log(`📝 [PHASE-3] Generating listings for ${productId}`);

    // Get product and market data
    const { data: productData } = await supabase
      .from('products')
      .select(`
        *,
        product_analysis_data(*),
        product_market_data(*)
      `)
      .eq('id', productId)
      .single();

    if (!productData) {
      throw new Error('Product data not found');
    }

    // Simulate listing generation
    await this.simulateAsyncWork(2000);

    // Mock listing data for different platforms
    const listings = [
      {
        platform: 'ebay',
        title: `${productData.name} - ${productData.model || 'Great Condition'}`,
        description: `High-quality ${productData.name} in excellent condition. Perfect for collectors and users alike.`,
        price: productData.product_market_data?.[0]?.average_market_price || 250,
        category: 'Electronics',
        shipping_cost: 15,
        handling_days: 3
      },
      {
        platform: 'amazon',
        title: `${productData.name} ${productData.model || ''}`.trim(),
        description: `Professional-grade ${productData.name}. Tested and verified for quality.`,
        price: (productData.product_market_data?.[0]?.average_market_price || 250) * 1.1,
        category: 'Electronics & Accessories',
        shipping_cost: 0,
        handling_days: 2
      },
      {
        platform: 'mercari',
        title: `${productData.name} - Ready to Ship!`,
        description: `Clean ${productData.name} in working condition. Ships fast!`,
        price: (productData.product_market_data?.[0]?.average_market_price || 250) * 0.9,
        category: 'Electronics',
        shipping_cost: 10,
        handling_days: 1
      }
    ];

    // Save listings
    for (const listing of listings) {
      await supabase
        .from('product_listings')
        .insert({
          product_id: productId,
          ...listing
        });
    }

    await this.logPipelineEvent(productId, 3, 'info', `Generated ${listings.length} listings`, 'listings_created');
  }

  /**
   * Process Phase 4: Publication & Monitoring
   */
  private async processPhase4(productId: string): Promise<void> {
    console.log(`🚀 [PHASE-4] Publishing listings for ${productId}`);

    // Get listings
    const { data: listings } = await supabase
      .from('product_listings')
      .select('*')
      .eq('product_id', productId);

    if (!listings || listings.length === 0) {
      throw new Error('No listings found for publication');
    }

    // Simulate publishing to each platform
    for (const listing of listings) {
      await this.simulateAsyncWork(1000);

      // Mock publication result
      const publicationResult = {
        status: Math.random() > 0.1 ? 'published' : 'failed',
        external_listing_id: `${listing.platform}_${Date.now()}`,
        published_url: `https://${listing.platform}.com/listing/${Date.now()}`,
        published_at: new Date().toISOString()
      };

      // Update listing with publication result
      await supabase
        .from('product_listings')
        .update(publicationResult)
        .eq('id', listing.id);

      await this.logPipelineEvent(
        productId, 
        4, 
        publicationResult.status === 'published' ? 'info' : 'warn',
        `${listing.platform} listing ${publicationResult.status}`,
        'publish_listing'
      );
    }

    // Set up monitoring (mock)
    await supabase
      .from('product_monitoring')
      .insert({
        product_id: productId,
        monitoring_enabled: true,
        check_frequency_hours: 24,
        price_alerts_enabled: true,
        competitor_tracking_enabled: true
      });

    await this.logPipelineEvent(productId, 4, 'info', 'Monitoring setup completed', 'monitoring_enabled');
  }

  /**
   * Update phase status
   */
  private async updatePhaseStatus(productId: string, phase: number, status: string): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
      updateData.progress_percentage = 0;
    }

    await supabase
      .from('pipeline_phases')
      .update(updateData)
      .eq('product_id', productId)
      .eq('phase_number', phase);
  }

  /**
   * Complete a phase
   */
  private async completePhase(productId: string, phase: number): Promise<void> {
    await supabase
      .from('pipeline_phases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      })
      .eq('product_id', productId)
      .eq('phase_number', phase);

    await this.logPipelineEvent(productId, phase, 'info', `Phase ${phase} completed`, 'complete_phase');
  }

  /**
   * Complete product processing
   */
  private async completeProduct(productId: string): Promise<void> {
    await supabase
      .from('products')
      .update({
        status: 'completed',
        is_pipeline_running: false,
        current_phase: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    await this.logPipelineEvent(productId, 4, 'info', 'Product processing completed', 'complete_product');
    console.log(`🎉 [BACKGROUND] Product ${productId} fully processed!`);

    // Automatically trigger AI market research after product completion
    try {
      console.log(`🔍 [BACKGROUND] Triggering automatic market research for completed product: ${productId}`);
      
      // Call the market research API in the background
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const researchResponse = await fetch(`${baseUrl}/api/dashboard/products/${productId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (researchResponse.ok) {
        const researchResult = await researchResponse.json();
        console.log(`✅ [BACKGROUND] Market research completed automatically:`, researchResult.message);
        
        // Log the successful research
        await this.logPipelineEvent(
          productId, 
          4, // Log as phase 4 completion event
          'info', 
          `Auto market research: Found ${researchResult.data?.amazonResults || 0} Amazon + ${researchResult.data?.ebayResults || 0} eBay results`, 
          'auto_market_research'
        );
      } else {
        console.warn(`⚠️ [BACKGROUND] Market research failed for ${productId}:`, await researchResponse.text());
      }
      
    } catch (researchError) {
      console.warn(`⚠️ [BACKGROUND] Market research error for ${productId}:`, researchError);
      // Don't fail the entire pipeline if market research fails
    }
  }

  /**
   * Handle job errors
   */
  private async handleJobError(job: QueuedProduct, errorMessage: string): Promise<void> {
    // Update phase status
    await supabase
      .from('pipeline_phases')
      .update({
        status: 'failed',
        error_message: errorMessage,
        retry_count: job.retryCount + 1
      })
      .eq('product_id', job.productId)
      .eq('phase_number', job.phase);

    await this.logPipelineEvent(job.productId, job.phase, 'error', errorMessage, 'phase_error');

    // Retry logic
    if (job.retryCount < 3) {
      console.log(`🔄 [BACKGROUND] Retrying job ${job.productId} phase ${job.phase} (attempt ${job.retryCount + 1})`);
      setTimeout(() => {
        job.retryCount++;
        this.queueProduct(job.productId, job.phase, 'high'); // High priority for retries
      }, Math.pow(2, job.retryCount) * 1000); // Exponential backoff
    } else {
      // Mark for manual review
      await supabase
        .from('products')
        .update({
          status: 'error',
          requires_manual_review: true,
          error_message: `Phase ${job.phase} failed after 3 retries: ${errorMessage}`,
          is_pipeline_running: false
        })
        .eq('id', job.productId);

      await this.logPipelineEvent(job.productId, job.phase, 'error', 'Max retries exceeded - manual review required', 'manual_review_required');
    }
  }

  /**
   * Log pipeline events
   */
  private async logPipelineEvent(
    productId: string, 
    phase: number, 
    level: string, 
    message: string, 
    action: string
  ): Promise<void> {
    try {
      await supabase
        .from('pipeline_logs')
        .insert({
          product_id: productId,
          phase_number: phase,
          log_level: level,
          message,
          action,
          details: {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log pipeline event:', error);
    }
  }

  /**
   * Simulate async work (replace with actual implementations)
   */
  private async simulateAsyncWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update processing statistics
   */
  private updateStats(processingTime: number): void {
    this.stats.totalProcessed++;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed;
  }

  /**
   * Cleanup orphaned jobs
   */
  private async cleanupOrphanedJobs(): Promise<void> {
    // Remove jobs that have been processing for too long
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    for (const productId of this.processing) {
      // Check if any phase has been running too long
      const { data: phases } = await supabase
        .from('pipeline_phases')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'running');

      for (const phase of phases || []) {
        const startedAt = new Date(phase.started_at).getTime();
        if (now - startedAt > staleThreshold) {
          console.log(`🧹 [BACKGROUND] Cleaning up stale job: ${productId} phase ${phase.phase_number}`);
          this.processing.delete(productId);
          
          await this.updatePhaseStatus(productId, phase.phase_number, 'failed');
          await this.logPipelineEvent(
            productId, 
            phase.phase_number, 
            'error', 
            'Job timed out and was cleaned up', 
            'timeout_cleanup'
          );
        }
      }
    }
  }

  /**
   * Log current queue status
   */
  private logQueueStatus(): void {
    console.log(`📊 [BACKGROUND] Queue: ${this.queue.length} pending, ${this.processing.size} processing`);
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats, currentlyProcessing: this.processing.size };
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: Array.from(this.processing),
      isRunning: this.isRunning
    };
  }
}

// Create and export singleton instance
export const backgroundProcessor = new BackgroundProcessor();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('🛑 [BACKGROUND] Received SIGINT, shutting down background processor...');
    backgroundProcessor.stopProcessor();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('🛑 [BACKGROUND] Received SIGTERM, shutting down background processor...');
    backgroundProcessor.stopProcessor();
    process.exit(0);
  });
}