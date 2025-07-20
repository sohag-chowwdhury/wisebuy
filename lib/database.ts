// lib/database.ts
import { supabase } from '@/lib/supabase/client';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';
// Add these imports to your existing imports
import { 
  saveProduct, 
  saveProductImages, 
  startPipelinePhase, 
  completePipelinePhase,
  logPipelineEvent 
} from './supabase/realtime-database'
export interface CreateProductParams {
  user_id: string;
  name?: string;
  images: File[];
}

export interface CreateProductResult {
  productId: string;
  imageUrls: string[];
}

export interface AnalysisResults {
  product_name: string;
  model: string;
  confidence: number;
  item_condition: string;
  condition_details: string;
  detected_categories: string[];
  detected_brands: string[];
  color_analysis: Record<string, any>;
  image_quality_score: number;
  completeness_score: number;
}

/**
 * Create a product with pipeline phases and upload images
 */
export async function createProductWithPipeline(params: CreateProductParams): Promise<CreateProductResult> {
  try {
    console.log(`📦 [DATABASE] Creating product for user ${params.user_id}...`);

    // 1. Create product record
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        user_id: params.user_id,
        name: params.name || 'Processing...',
        status: 'uploaded',
        is_pipeline_running: false,
        current_phase: 1
      })
      .select()
      .single();

    if (productError) {
      throw new Error(`Failed to create product: ${productError.message}`);
    }

    console.log(`✅ [DATABASE] Product created: ${product.id}`);

    // 2. Create pipeline phases
    const phases = [
      { phase_number: 1, phase_name: 'Product Analysis', can_start: true },
      { phase_number: 2, phase_name: 'Market Research', can_start: false },
      { phase_number: 3, phase_name: 'Listing Generation', can_start: false },
      { phase_number: 4, phase_name: 'Publication & Monitoring', can_start: false }
    ];

    const { error: phasesError } = await supabaseAdmin
      .from('pipeline_phases')
      .insert(
        phases.map(phase => ({
          product_id: product.id,
          ...phase
        }))
      );

    if (phasesError) {
      throw new Error(`Failed to create pipeline phases: ${phasesError.message}`);
    }

    console.log(`📋 [DATABASE] Pipeline phases created for product ${product.id}`);

    // 3. Upload images to storage
    const imageUrls: string[] = [];
    for (let i = 0; i < params.images.length; i++) {
      const file = params.images[i];
      const fileName = `${product.id}/${Date.now()}-${i}-${file.name}`;
      
      try {
        // Convert File to buffer for storage
        const buffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ [DATABASE] Upload error for ${fileName}:`, uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);

        // Save image record
        const { error: imageError } = await supabaseAdmin
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: publicUrl,
            storage_path: fileName,
            is_primary: i === 0,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          });

        if (imageError) {
          console.error(`❌ [DATABASE] Image record error:`, imageError);
        }

        console.log(`📸 [DATABASE] Image uploaded: ${fileName}`);
      } catch (error) {
        console.error(`❌ [DATABASE] Error processing image ${i}:`, error);
        throw error;
      }
    }

    return {
      productId: product.id,
      imageUrls
    };

  } catch (error) {
    console.error('❌ [DATABASE] Error in createProductWithPipeline:', error);
    throw error;
  }
}

/**
 * Start pipeline processing for a product
 */
export async function startPipelineProcessing(productId: string): Promise<void> {
  try {
    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'processing',
        is_pipeline_running: true,
        current_phase: 1
      })
      .eq('id', productId);

    // Start Phase 1
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        progress_percentage: 0
      })
      .eq('product_id', productId)
      .eq('phase_number', 1);

    console.log(`🚀 [DATABASE] Pipeline started for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error starting pipeline:', error);
    throw error;
  }
}

/**
 * Save AI analysis results
 */
export async function saveAnalysisResults(productId: string, results: AnalysisResults): Promise<void> {
  try {
    // Save analysis data
    const { error: analysisError } = await supabaseAdmin
      .from('product_analysis_data')
      .insert({
        product_id: productId,
        ...results
      });

    if (analysisError) {
      throw new Error(`Failed to save analysis: ${analysisError.message}`);
    }

    // Update product with analysis results
    const { error: productError } = await supabaseAdmin
      .from('products')
      .update({
        name: results.product_name,
        model: results.model,
        ai_confidence: results.confidence
      })
      .eq('id', productId);

    if (productError) {
      throw new Error(`Failed to update product: ${productError.message}`);
    }

    console.log(`💾 [DATABASE] Analysis results saved for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error saving analysis results:', error);
    throw error;
  }
}

/**
 * Complete a pipeline phase
 */
export async function completePhase(productId: string, phaseNumber: number): Promise<void> {
  try {
    // Complete current phase
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber);

    // Enable next phase if exists
    if (phaseNumber < 4) {
      await supabaseAdmin
        .from('pipeline_phases')
        .update({
          can_start: true,
          status: 'pending'
        })
        .eq('product_id', productId)
        .eq('phase_number', phaseNumber + 1);

      // Update product current phase
      await supabaseAdmin
        .from('products')
        .update({
          current_phase: phaseNumber + 1
        })
        .eq('id', productId);
    } else {
      // All phases complete
      await supabaseAdmin
        .from('products')
        .update({
          status: 'completed',
          is_pipeline_running: false
        })
        .eq('id', productId);
    }

    console.log(`✅ [DATABASE] Phase ${phaseNumber} completed for product ${productId}`);
  } catch (error) {
    console.error(`❌ [DATABASE] Error completing phase ${phaseNumber}:`, error);
    throw error;
  }
}

/**
 * Log pipeline events
 */
export async function logPipelineEvent(
  productId: string,
  phaseNumber: number,
  level: 'info' | 'warn' | 'error',
  message: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabaseAdmin
      .from('pipeline_logs')
      .insert({
        product_id: productId,
        phase_number: phaseNumber,
        log_level: level,
        message,
        action,
        details: details || {}
      });
  } catch (error) {
    console.error('❌ [DATABASE] Error logging pipeline event:', error);
    // Don't throw here to avoid breaking the main process
  }
}

/**
 * Get product with full pipeline status
 */
export async function getProductWithPipeline(productId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        pipeline_phases(*),
        product_images(*),
        product_analysis_data(*),
        product_market_data(*),
        product_listings(*),
        pipeline_logs(*)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('❌ [DATABASE] Error getting product:', error);
    throw error;
  }
}

/**
 * Get user's products with pipeline status
 */
export async function getUserProducts(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        pipeline_phases(phase_number, phase_name, status, progress_percentage),
        product_images(image_url, is_primary)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user products: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('❌ [DATABASE] Error getting user products:', error);
    throw error;
  }
}

/**
 * Retry a failed phase
 */
export async function retryPhase(productId: string, phaseNumber: number): Promise<void> {
  try {
    // Reset phase status
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null,
        progress_percentage: 0
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber);

    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'processing',
        is_pipeline_running: true,
        requires_manual_review: false,
        error_message: null
      })
      .eq('id', productId);

    await logPipelineEvent(productId, phaseNumber, 'info', `Phase ${phaseNumber} retry initiated`, 'retry_phase');
    console.log(`🔄 [DATABASE] Phase ${phaseNumber} retry set up for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error retrying phase:', error);
    throw error;
  }
}

/**
 * Pause pipeline processing
 */
export async function pausePipeline(productId: string): Promise<void> {
  try {
    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'paused',
        is_pipeline_running: false
      })
      .eq('id', productId);

    // Pause running phases
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'stopped',
        stopped_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('status', 'running');

    await logPipelineEvent(productId, 0, 'info', 'Pipeline paused by user', 'pause_pipeline');
    console.log(`⏸️ [DATABASE] Pipeline paused for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error pausing pipeline:', error);
    throw error;
  }
}

/**
 * Resume pipeline processing
 */
export async function resumePipeline(productId: string): Promise<void> {
  try {
    // Get current phase
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('current_phase')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'processing',
        is_pipeline_running: true
      })
      .eq('id', productId);

    // Resume current phase
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'pending',
        stopped_at: null
      })
      .eq('product_id', productId)
      .eq('phase_number', product.current_phase)
      .eq('status', 'stopped');

    await logPipelineEvent(productId, product.current_phase, 'info', 'Pipeline resumed by user', 'resume_pipeline');
    console.log(`▶️ [DATABASE] Pipeline resumed for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error resuming pipeline:', error);
    throw error;
  }
}

/**
 * Cancel pipeline processing
 */
export async function cancelPipeline(productId: string): Promise<void> {
  try {
    // Update product status
    await supabaseAdmin
      .from('products')
      .update({
        status: 'error',
        is_pipeline_running: false,
        error_message: 'Pipeline cancelled by user'
      })
      .eq('id', productId);

    // Cancel all pending/running phases
    await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'stopped',
        stopped_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .in('status', ['pending', 'running']);

    await logPipelineEvent(productId, 0, 'warn', 'Pipeline cancelled by user', 'cancel_pipeline');
    console.log(`❌ [DATABASE] Pipeline cancelled for product ${productId}`);
  } catch (error) {
    console.error('❌ [DATABASE] Error cancelling pipeline:', error);
    throw error;
  }
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(userId?: string) {
  try {
    let query = supabaseAdmin
      .from('products')
      .select('status, created_at, ai_confidence');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: products, error } = await query;

    if (error) {
      throw new Error(`Failed to get pipeline stats: ${error.message}`);
    }

    const stats = {
      total: products.length,
      uploaded: products.filter(p => p.status === 'uploaded').length,
      processing: products.filter(p => p.status === 'processing').length,
      completed: products.filter(p => p.status === 'completed').length,
      error: products.filter(p => p.status === 'error').length,
      paused: products.filter(p => p.status === 'paused').length,
      averageConfidence: products.reduce((sum, p) => sum + (p.ai_confidence || 0), 0) / products.length || 0,
      processingTime: {
        today: products.filter(p => {
          const today = new Date().toDateString();
          return new Date(p.created_at).toDateString() === today;
        }).length,
        thisWeek: products.filter(p => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(p.created_at) >= weekAgo;
        }).length
      }
    };

    return stats;
  } catch (error) {
    console.error('❌ [DATABASE] Error getting pipeline stats:', error);
    throw error;
  }
}

/**
 * Clean up old logs (for maintenance)
 */
export async function cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabaseAdmin
      .from('pipeline_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup logs: ${error.message}`);
    }

    console.log(`🧹 [DATABASE] Cleaned up logs older than ${daysToKeep} days`);
  } catch (error) {
    console.error('❌ [DATABASE] Error cleaning up logs:', error);
    throw error;
  }
}

/**
 * Helper function to map condition strings to database values
 */
export function mapConditionToDatabase(condition: string): string {
  const conditionMap: Record<string, string> = {
    'excellent': 'excellent',
    'very good': 'very_good',
    'good': 'good',
    'fair': 'fair',
    'poor': 'poor',
    'for parts': 'for_parts'
  };

  return conditionMap[condition.toLowerCase()] || 'good';
}

/**
 * Real-time subscription helpers
 */
export function subscribeToProduct(productId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`product-${productId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `id=eq.${productId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pipeline_phases',
        filter: `product_id=eq.${productId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pipeline_logs',
        filter: `product_id=eq.${productId}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToUserProducts(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`user-products-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

// Export admin client for server-side operations
export { supabaseAdmin };