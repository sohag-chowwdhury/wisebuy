// lib/database.ts
import { supabase } from '@/lib/supabase/client';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

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

// =====================================================
// ENHANCED REAL-TIME DATABASE FUNCTIONS
// =====================================================

// Type definitions for better type safety
type Product = {
  id: string;
  user_id: string;
  name: string | null;
  model: string | null;
  status: 'uploaded' | 'processing' | 'completed' | 'error' | 'paused';
  current_phase: number;
  progress: number;
  ai_confidence: number | null;
  is_pipeline_running: boolean;
  created_at: string;
  updated_at: string;
}

type ProductInsert = {
  user_id: string;
  name?: string | null;
  model?: string | null;
  status?: 'uploaded' | 'processing' | 'completed' | 'error' | 'paused';
  current_phase?: number;
  progress?: number;
  ai_confidence?: number | null;
  is_pipeline_running?: boolean;
}

type ProductUpdate = {
  name?: string | null;
  model?: string | null;
  status?: 'uploaded' | 'processing' | 'completed' | 'error' | 'paused';
  current_phase?: number;
  progress?: number;
  ai_confidence?: number | null;
  is_pipeline_running?: boolean;
  updated_at?: string;
}

/**
 * REAL-TIME: Save a new product to the database with real-time updates
 */
export async function saveProduct(productData: ProductInsert): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...productData,
        status: productData.status || 'uploaded',
        current_phase: productData.current_phase || 1,
        progress: productData.progress || 0,
        is_pipeline_running: productData.is_pipeline_running || false
      })
      .select()
      .single()

    if (error) throw error

    // Log the product creation
    await logPipelineEventRT(data.id, 0, 'info', 'Product created successfully', 'product_created', {
      productName: data.name,
      model: data.model,
      userId: data.user_id
    })

    console.log(`✅ [RT-DATABASE] Product created: ${data.id}`)
    return data
  } catch (error) {
    console.error('❌ [RT-DATABASE] Error saving product:', error)
    throw new Error(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Update existing product with real-time sync
 */
export async function updateProduct(
  productId: string, 
  updates: ProductUpdate
): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    // Log the update
    await logPipelineEventRT(productId, data.current_phase, 'info', 'Product updated', 'product_updated', {
      updatedFields: Object.keys(updates),
      newStatus: data.status
    })

    console.log(`🔄 [RT-DATABASE] Product updated: ${productId}`)
    return data
  } catch (error) {
    console.error('❌ [RT-DATABASE] Error updating product:', error)
    throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Update product status with automatic phase progression
 */
export async function updateProductStatus(
  productId: string, 
  status: Product['status'],
  phase?: number,
  progress?: number
): Promise<void> {
  try {
    const updates: ProductUpdate = {
      status,
      updated_at: new Date().toISOString()
    }

    if (phase !== undefined) updates.current_phase = phase
    if (progress !== undefined) updates.progress = progress

    const { error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) throw error

    // Log status change
    await logPipelineEventRT(productId, phase || 0, 'info', `Status changed to ${status}`, 'status_update', {
      newStatus: status,
      newPhase: phase,
      progress: progress
    })

    console.log(`📊 [RT-DATABASE] Status updated: ${productId} -> ${status}`)

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error updating product status:', error)
    throw new Error(`Failed to update product status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Save product images with real-time updates
 */
export async function saveProductImages(
  productId: string,
  imageFiles: File[]
): Promise<string[]> {
  try {
    const imagePaths: string[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const fileName = `${productId}/${Date.now()}-${i}-${file.name}`
      
      // Convert File to buffer for storage
      const buffer = await file.arrayBuffer()
      
      // Upload to Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(fileName)

      imagePaths.push(publicUrl)

      // Save image record to database
      const { error: dbError } = await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          storage_path: fileName,
          is_primary: i === 0,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        })

      if (dbError) {
        console.error(`❌ [RT-DATABASE] Image record error:`, dbError)
      }

      console.log(`📸 [RT-DATABASE] Image uploaded: ${fileName}`)
    }

    // Log image upload
    await logPipelineEventRT(productId, 0, 'info', 'Product images uploaded', 'images_uploaded', {
      imageCount: imageFiles.length,
      imagePaths
    })

    return imagePaths

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error saving product images:', error)
    throw new Error(`Failed to save images: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Start a new pipeline phase
 */
export async function startPipelinePhaseRT(
  productId: string,
  phaseNumber: number,
  phaseName: string
): Promise<any> {
  try {
    // First check if phase already exists
    const { data: existingPhase } = await supabaseAdmin
      .from('pipeline_phases')
      .select()
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber)
      .single()

    if (existingPhase) {
      // Update existing phase
      const { data, error } = await supabaseAdmin
        .from('pipeline_phases')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          error_message: null,
          retry_count: (existingPhase.retry_count || 0) + 1
        })
        .eq('id', existingPhase.id)
        .select()
        .single()

      if (error) throw error
      
      console.log(`🔄 [RT-DATABASE] Phase ${phaseNumber} restarted: ${productId}`)
      return data
    } else {
      // Create new phase
      const { data, error } = await supabaseAdmin
        .from('pipeline_phases')
        .insert({
          product_id: productId,
          phase_number: phaseNumber,
          phase_name: phaseName,
          status: 'running',
          started_at: new Date().toISOString(),
          can_start: true,
          progress_percentage: 0
        })
        .select()
        .single()

      if (error) throw error

      // Update product phase
      await updateProductStatus(productId, 'processing', phaseNumber, 0)

      console.log(`🚀 [RT-DATABASE] Phase ${phaseNumber} started: ${productId}`)
      return data
    }
  } catch (error) {
    console.error(`❌ [RT-DATABASE] Error starting pipeline phase ${phaseNumber}:`, error)
    throw new Error(`Failed to start phase ${phaseNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Complete a pipeline phase
 */
export async function completePipelinePhaseRT(
  productId: string,
  phaseNumber: number,
  outputData?: any
): Promise<void> {
  try {
    const completedAt = new Date().toISOString()
    
    // Get phase start time to calculate duration
    const { data: phase } = await supabaseAdmin
      .from('pipeline_phases')
      .select('started_at')
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber)
      .single()

    let processingTime = 0
    if (phase?.started_at) {
      processingTime = Math.floor(
        (new Date(completedAt).getTime() - new Date(phase.started_at).getTime()) / 1000
      )
    }

    // Update phase status
    const { error } = await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'completed',
        completed_at: completedAt,
        progress_percentage: 100,
        processing_time_seconds: processingTime
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber)

    if (error) throw error

    // Update product progress
    const newProgress = Math.min((phaseNumber / 4) * 100, 100)
    const isComplete = phaseNumber >= 4

    await updateProductStatus(
      productId, 
      isComplete ? 'completed' : 'processing',
      isComplete ? phaseNumber : phaseNumber + 1,
      newProgress
    )

    // Log completion
    await logPipelineEventRT(productId, phaseNumber, 'info', `Phase ${phaseNumber} completed`, 'phase_completed', {
      processingTime,
      outputData: outputData ? 'Generated' : 'None'
    })

    // Start next phase if not complete
    if (!isComplete) {
      await enableNextPhase(productId, phaseNumber + 1)
    } else {
      // Product is complete - trigger automatic market research
      try {
        console.log(`🔍 [RT-DATABASE] Triggering automatic market research for completed product: ${productId}`)
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const researchResponse = await fetch(`${baseUrl}/api/dashboard/products/${productId}/research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (researchResponse.ok) {
          const researchResult = await researchResponse.json()
          console.log(`✅ [RT-DATABASE] Auto market research completed:`, researchResult.message)
          
          await logPipelineEventRT(
            productId, 
            4, 
            'info', 
            `Auto market research: Found ${researchResult.data?.amazonResults || 0} Amazon + ${researchResult.data?.ebayResults || 0} eBay results`, 
            'auto_market_research'
          )
        } else {
          console.warn(`⚠️ [RT-DATABASE] Market research failed:`, await researchResponse.text())
        }
        
      } catch (researchError) {
        console.warn(`⚠️ [RT-DATABASE] Market research error:`, researchError)
      }
    }

    console.log(`✅ [RT-DATABASE] Phase ${phaseNumber} completed: ${productId}`)

  } catch (error) {
    console.error(`❌ [RT-DATABASE] Error completing pipeline phase ${phaseNumber}:`, error)
    throw new Error(`Failed to complete phase ${phaseNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Fail a pipeline phase with error handling
 */
export async function failPipelinePhaseRT(
  productId: string,
  phaseNumber: number,
  errorMessage: string,
  canRetry: boolean = true
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('pipeline_phases')
      .update({
        status: 'failed',
        error_message: errorMessage,
        stopped_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('phase_number', phaseNumber)

    if (error) throw error

    // Update product status
    await updateProductStatus(productId, 'error')

    // Log error
    await logPipelineEventRT(productId, phaseNumber, 'error', `Phase ${phaseNumber} failed`, 'phase_failed', {
      errorMessage,
      canRetry
    })

    console.log(`❌ [RT-DATABASE] Phase ${phaseNumber} failed: ${productId}`)

  } catch (error) {
    console.error(`❌ [RT-DATABASE] Error failing pipeline phase ${phaseNumber}:`, error)
    throw new Error(`Failed to update phase failure: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Enable the next phase in pipeline
 */
export async function enableNextPhase(productId: string, phaseNumber: number): Promise<void> {
  const phaseNames = {
    1: 'Product Analysis',
    2: 'Market Research', 
    3: 'SEO Analysis',
    4: 'Listing Generation'
  }

  try {
    const { error } = await supabaseAdmin
      .from('pipeline_phases')
      .upsert({
        product_id: productId,
        phase_number: phaseNumber,
        phase_name: phaseNames[phaseNumber as keyof typeof phaseNames] || `Phase ${phaseNumber}`,
        status: 'pending',
        can_start: true,
        progress_percentage: 0
      })

    if (error) throw error

    console.log(`⏭️ [RT-DATABASE] Next phase enabled: ${phaseNumber} for ${productId}`)

  } catch (error) {
    console.error(`❌ [RT-DATABASE] Error enabling next phase ${phaseNumber}:`, error)
    throw new Error(`Failed to enable phase ${phaseNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Save analysis data for any phase
 */
export async function saveAnalysisDataRT(
  productId: string,
  phaseNumber: number,
  analysisData: any,
  tableName: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .upsert({
        product_id: productId,
        ...analysisData,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    // Log data save
    await logPipelineEventRT(productId, phaseNumber, 'info', `${tableName} data saved`, 'data_saved', {
      dataKeys: Object.keys(analysisData),
      tableName
    })

    console.log(`💾 [RT-DATABASE] ${tableName} data saved: ${productId}`)

  } catch (error) {
    console.error(`❌ [RT-DATABASE] Error saving ${tableName} data:`, error)
    throw new Error(`Failed to save ${tableName} data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Log pipeline events with real-time updates
 */
export async function logPipelineEventRT(
  productId: string,
  phaseNumber: number,
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  action: string,
  details: any = {}
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('pipeline_logs')
      .insert({
        product_id: productId,
        phase_number: phaseNumber,
        log_level: level,
        message,
        action,
        details
      })

    if (error && level === 'error') {
      console.error('❌ [RT-DATABASE] Failed to log pipeline event:', error)
    }

  } catch (error) {
    // Don't throw on logging errors to avoid breaking main flow
    console.error('❌ [RT-DATABASE] Error in logging function:', error)
  }
}

/**
 * REAL-TIME: Set up real-time subscription for product updates
 */
export function subscribeToProductUpdatesRT(
  userId: string,
  onUpdate: (payload: any) => void
) {
  return supabase
    .channel('product_updates_rt')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${userId}`
      },
      onUpdate
    )
    .subscribe()
}

/**
 * REAL-TIME: Set up real-time subscription for pipeline phase updates
 */
export function subscribeToPipelineUpdatesRT(
  productId: string,
  onUpdate: (payload: any) => void
) {
  return supabase
    .channel('pipeline_updates_rt')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pipeline_phases',
        filter: `product_id=eq.${productId}`
      },
      onUpdate
    )
    .subscribe()
}

/**
 * REAL-TIME: Set up real-time subscription for pipeline logs
 */
export function subscribeToLogsRT(
  productId: string,
  onLog: (payload: any) => void
) {
  return supabase
    .channel('pipeline_logs_rt')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pipeline_logs',
        filter: `product_id=eq.${productId}`
      },
      onLog
    )
    .subscribe()
}

/**
 * ENHANCED: Create product with real-time features
 */
export async function createProductWithRealtime(params: CreateProductParams): Promise<CreateProductResult> {
  console.log('🎯 [RT-DATABASE] Creating product with real-time support...');
  
  try {
    // 1. Save product using real-time functions
    const product = await saveProduct({
      user_id: params.user_id,
      name: params.name || `Product ${Date.now()}`,
      status: 'uploaded',
      current_phase: 1,
      progress: 0
    });

    // 2. Save images using real-time functions
    const imagePaths = await saveProductImages(product.id, params.images);

    // 3. Start Phase 1
    await startPipelinePhaseRT(product.id, 1, 'Product Analysis');

    console.log('✅ [RT-DATABASE] Product created with real-time support');
    
    return {
      productId: product.id,
      imageUrls: imagePaths
    };

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error creating product with real-time:', error);
    throw error;
  }
}

// =====================================================
// EXISTING FUNCTIONS (UNCHANGED)
// =====================================================

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
        const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
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
 * Real-time subscription helpers (EXISTING - keeping for backward compatibility)
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

// =====================================================
// REAL-TIME BATCH OPERATIONS
// =====================================================

/**
 * REAL-TIME: Batch save multiple products
 */
export async function batchSaveProductsRT(products: ProductInsert[]): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(products)
      .select()

    if (error) throw error

    // Log batch operation
    await logPipelineEventRT('batch', 0, 'info', 'Batch products saved', 'batch_save', {
      count: products.length,
      productIds: data.map(p => p.id)
    })

    console.log(`📦 [RT-DATABASE] Batch saved ${products.length} products`)
    return data

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error batch saving products:', error)
    throw new Error(`Failed to batch save products: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * REAL-TIME: Batch update product statuses
 */
export async function batchUpdateProductStatusesRT(
  updates: Array<{ id: string; status: Product['status']; phase?: number }>
): Promise<void> {
  try {
    const promises = updates.map(update => 
      updateProductStatus(update.id, update.status, update.phase)
    )

    await Promise.all(promises)

    console.log(`🔄 [RT-DATABASE] Batch updated ${updates.length} product statuses`)

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error batch updating statuses:', error)
    throw new Error(`Failed to batch update statuses: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// =====================================================
// REAL-TIME DATABASE HEALTH & MONITORING
// =====================================================

/**
 * REAL-TIME: Get database health status
 */
export async function getDatabaseHealthRT(): Promise<{
  status: 'healthy' | 'warning' | 'error'
  metrics: {
    connectionOk: boolean
    processingProducts: number
    timestamp: string
    realTimeEnabled: boolean
    error?: string
  }
}> {
  try {
    // Check connection with a simple query
    const { data: _connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (connectionError) throw connectionError

    // Get processing products count
    const { data: processingStats, error: statsError } = await supabase
      .from('products')
      .select('id')
      .eq('status', 'processing')

    if (statsError) throw statsError

    return {
      status: 'healthy',
      metrics: {
        connectionOk: true,
        processingProducts: processingStats?.length || 0,
        timestamp: new Date().toISOString(),
        realTimeEnabled: true
      }
    }

  } catch (error) {
    return {
      status: 'error',
      metrics: {
        connectionOk: false,
        processingProducts: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        realTimeEnabled: false
      }
    }
  }
}

/**
 * REAL-TIME: Clean up old logs (keep only last 30 days)
 */
export async function cleanupOldLogsRT(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabaseAdmin
      .from('pipeline_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (error) throw error

    console.log('🧹 [RT-DATABASE] Old logs cleaned up successfully')

  } catch (error) {
    console.error('❌ [RT-DATABASE] Error cleaning up logs:', error)
  }
}

// =====================================================
// EXPORT STATEMENT
// =====================================================

// Export admin client for server-side operations
export { supabaseAdmin };

// =====================================================
// USAGE EXAMPLES AND MIGRATION GUIDE
// =====================================================

/**
 * MIGRATION GUIDE:
 * 
 * 1. EXISTING CODE (Still works):
 *    - createProductWithPipeline() -> keeps working
 *    - All existing functions remain unchanged
 * 
 * 2. NEW REAL-TIME CODE:
 *    - createProductWithRealtime() -> enhanced version
 *    - saveProduct() -> real-time product creation
 *    - updateProduct() -> real-time updates
 *    - startPipelinePhaseRT() -> real-time phase management
 * 
 * 3. REAL-TIME SUBSCRIPTIONS:
 *    - subscribeToProductUpdatesRT() -> live product updates
 *    - subscribeToPipelineUpdatesRT() -> live phase updates
 *    - subscribeToLogsRT() -> live log updates
 * 
 * USAGE EXAMPLES:
 * 
 * // Traditional way (still works)
 * const result = await createProductWithPipeline({
 *   user_id: 'user-123',
 *   name: 'iPhone 15',
 *   images: files
 * })
 * 
 * // New real-time way
 * const result = await createProductWithRealtime({
 *   user_id: 'user-123',
 *   name: 'iPhone 15',
 *   images: files
 * })
 * 
 * // Real-time subscriptions
 * const subscription = subscribeToProductUpdatesRT(userId, (payload) => {
 *   console.log('Product updated:', payload)
 * })
 * 
 * // Manual product creation with real-time
 * const product = await saveProduct({
 *   user_id: 'user-123',
 *   name: 'New Product',
 *   status: 'uploaded'
 * })
 * 
 * // Start real-time pipeline
 * await startPipelinePhaseRT(product.id, 1, 'Product Analysis')
 * 
 * // Update with real-time sync
 * await updateProduct(product.id, {
 *   name: 'Updated Name',
 *   ai_confidence: 95
 * })
 * 
 * // Complete phase with real-time
 * await completePipelinePhaseRT(product.id, 1, analysisResults)
 */