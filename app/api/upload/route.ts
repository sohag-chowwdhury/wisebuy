// app/api/upload/route.ts
import { claudeService } from "@/lib/ai-services";
import {
  createStreamingResponse,
  APIError,
  checkRateLimit,
} from "@/lib/api-utils";
import { VALIDATION_RULES } from "@/lib/constants";
import { 
  createProductWithPipeline, 
  startPipelineProcessing, 
  saveAnalysisResults,
  logPipelineEvent 
} from "@/lib/database";
import { getUserId } from "@/lib/supabase/auth";
import { backgroundProcessor } from '@/lib/background-processor';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    // Validate request
    if (!files.length) {
      throw new APIError("No images provided", 400);
    }

    if (files.length > VALIDATION_RULES.MAX_FILES) {
      throw new APIError(
        `Too many files. Maximum ${VALIDATION_RULES.MAX_FILES} allowed`,
        400
      );
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!VALIDATION_RULES.ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new APIError(`Invalid file type: ${file.type}`, 400);
      }
      if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
        throw new APIError(
          `File too large: ${file.name}. Maximum ${
            VALIDATION_RULES.MAX_FILE_SIZE / 1024 / 1024
          }MB allowed`,
          400
        );
      }
    }

    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP)) {
      throw new APIError("Rate limit exceeded. Please try again later.", 429);
    }

    // Get user ID from your existing auth system
    const userId = await getUserId();

    console.log(`📤 [UPLOAD] Processing ${files.length} files for user ${userId}...`);

    const { stream, sendProgress, sendResult, sendError, close, headers } =
      createStreamingResponse();

    // Start async processing
    (async () => {
      let productId: string | null = null;
      
      try {
        await sendProgress(5);

        // Step 1: Create product in database with images
        console.log("💾 [UPLOAD] Creating product record...");
        const dbResult = await createProductWithPipeline({
          user_id: userId,
          name: "Processing...", // Will be updated after analysis
          images: files
        });
        
        productId = dbResult.productId;
        
        // Send immediate response that product is created
        await sendResult("product_created", { 
          productId,
          message: "Product created! Analysis starting...",
          imageUrls: dbResult.imageUrls
        });
        await sendProgress(20);

        // Step 2: Start pipeline processing in database
        await startPipelineProcessing(productId);
        await logPipelineEvent(productId, 1, 'info', 'Started image analysis phase', 'start_phase');

        await sendProgress(30);

        // Step 3: Convert files to buffers for AI analysis
        console.log("📸 [UPLOAD] Converting files to buffers...");
        const imageBuffers = await Promise.all(
          files.map(async (file) => Buffer.from(await file.arrayBuffer()))
        );

        await sendProgress(50);

        // Step 4: Run AI analysis
        console.log("🤖 [UPLOAD] Starting AI analysis...");
        const analysis = await claudeService.analyzeImages(imageBuffers);

        await sendProgress(80);

        // Step 5: Save analysis results to database
        console.log("💾 [UPLOAD] Saving analysis results...");
        await saveAnalysisResults(productId, {
          product_name: analysis.model || "Unknown Product",
          model: analysis.model || "",
          confidence: analysis.confidence || 0,
          item_condition: mapConditionToDatabase(analysis.condition || "good"),
          condition_details: analysis.defects?.join(", ") || "No defects detected",
          detected_categories: [],
          detected_brands: [],
          color_analysis: {},
          image_quality_score: 85, // Default score
          completeness_score: 90 // Default score
        });

        await logPipelineEvent(productId, 1, 'info', 'Analysis completed successfully', 'complete_phase');

        // Send analysis result and database confirmation
        await sendResult("analysis", analysis);
        await sendResult("database_saved", { 
          productId,
          message: "Analysis saved! Background processing will continue.",
          canCloseModal: true
        });

        await sendProgress(100);
        console.log(`✅ [UPLOAD] Upload and initial analysis complete for product ${productId}!`);

        // Queue for background processing (phases 2-4)
        backgroundProcessor.queueProduct(productId);

      } catch (error) {
        console.error("💥 [UPLOAD] Error processing upload:", error);
        
        if (productId) {
          await logPipelineEvent(productId, 1, 'error', `Upload error: ${(error as Error).message}`, 'error');
          
          // Update product status to error using your admin client
          const { supabase: supabaseAdmin } = await import('@/lib/supabase/admin');
          await supabaseAdmin
            .from('products')
            .update({
              status: 'error',
              error_message: (error as Error).message,
              is_pipeline_running: false,
              requires_manual_review: true
            })
            .eq('id', productId);
        }
        
        await sendError(
          error instanceof APIError ? error.message : "Error processing upload"
        );
      } finally {
        await close();
      }
    })();

    return new Response(stream, { headers });
  } catch (error) {
    console.error("💥 [UPLOAD] Error in upload API:", error);

    if (error instanceof APIError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Map analysis condition to database enum
function mapConditionToDatabase(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'new': 'new',
    'excellent': 'like-new',
    'very-good': 'very-good',
    'good': 'good',
    'fair': 'acceptable',
    'poor': 'poor'
  };
  
  return conditionMap[condition.toLowerCase()] || 'good';
}