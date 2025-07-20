// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  console.log('🎯 POST route hit! Request received');
  
  try {
    // Get the FormData from the request
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const productName = formData.get('name') as string;
    const model = formData.get('model') as string;
    const brand = formData.get('brand') as string;
    const category = formData.get('category') as string;
    
    console.log('📁 Files received:', files.length);
    console.log('📁 Product Name:', productName);
    
    // Use the fixed demo user ID that exists in auth.users table
    const demoUserId = '12345678-1234-1234-1234-123456789012';
    console.log('📁 Using fixed demo user ID:', demoUserId);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Create server-side Supabase client
    const supabase = createServerClient();

    // Create a streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const statusData = JSON.stringify({
            type: 'status',
            message: 'Creating product record...'
          });
          controller.enqueue(encoder.encode(statusData + '\n'));

          // Send progress updates
          const progressData = JSON.stringify({
            type: 'progress',
            value: 10
          });
          controller.enqueue(encoder.encode(progressData + '\n'));

          // 1. Create product record in database (matching actual schema)
          const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
              user_id: demoUserId,
              name: productName || `Product ${Date.now()}`,
              model: model || null,
              status: 'uploaded',
              current_phase: 1,
              ai_confidence: null,
              is_pipeline_running: false,
              error_message: null,
              requires_manual_review: false
            })
            .select()
            .single();

          if (productError) {
            throw new Error(`Failed to create product: ${productError.message}`);
          }

          console.log('✅ Product created:', product.id);

          // Update progress
          const progressData2 = JSON.stringify({
            type: 'progress',
            value: 30
          });
          controller.enqueue(encoder.encode(progressData2 + '\n'));

          // 2. Upload images to storage and create image records
          const statusData2 = JSON.stringify({
            type: 'status',
            message: 'Uploading images to storage...'
          });
          controller.enqueue(encoder.encode(statusData2 + '\n'));

          const imageUrls: string[] = [];
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `${product.id}/${Date.now()}-${i}-${file.name}`;
            
            try {
              // Convert File to ArrayBuffer for upload
              const arrayBuffer = await file.arrayBuffer();
              
              // Upload to Supabase storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, arrayBuffer, {
                  contentType: file.type,
                  upsert: false
                });

              if (uploadError) {
                console.error(`❌ Upload error for ${fileName}:`, uploadError);
                throw new Error(`Failed to upload image: ${uploadError.message}`);
              }

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

              imageUrls.push(publicUrl);

              // Save image record to database (matching actual schema)
              const { error: imageError } = await supabase
                .from('product_images')
                .insert({
                  product_id: product.id,
                  image_url: publicUrl,
                  storage_path: fileName,
                  is_primary: i === 0, // First image is primary
                  file_name: file.name,
                  file_size: file.size,
                  mime_type: file.type
                  // Remove width, height, quality_score for now - they can be added later by image analysis
                });

              if (imageError) {
                console.error(`❌ Image record error:`, imageError);
                throw new Error(`Failed to save image record: ${imageError.message}`);
              }

              console.log(`📸 Image uploaded: ${fileName}`);
              
              // Update progress for each image
              const imageProgress = 30 + (i + 1) * (40 / files.length);
              const progressData3 = JSON.stringify({
                type: 'progress',
                value: Math.round(imageProgress)
              });
              controller.enqueue(encoder.encode(progressData3 + '\n'));

            } catch (error) {
              console.error(`❌ Error processing image ${i}:`, error);
              throw error;
            }
          }

          // 3. Create pipeline phases (matching actual schema)
          const statusData3 = JSON.stringify({
            type: 'status',
            message: 'Setting up processing pipeline...'
          });
          controller.enqueue(encoder.encode(statusData3 + '\n'));

          const phases = [
            { phase_number: 1, phase_name: 'Product Analysis', can_start: true, status: 'pending' },
            { phase_number: 2, phase_name: 'Market Research', can_start: false, status: 'pending' },
            { phase_number: 3, phase_name: 'Smart Pricing', can_start: false, status: 'pending' },
            { phase_number: 4, phase_name: 'SEO & Publishing', can_start: false, status: 'pending' }
          ];

          const { error: phasesError } = await supabase
            .from('pipeline_phases')
            .insert(
              phases.map(phase => ({
                product_id: product.id,
                phase_number: phase.phase_number,
                phase_name: phase.phase_name,
                status: phase.status,
                can_start: phase.can_start,
                progress_percentage: 0,
                started_at: null,
                completed_at: null,
                stopped_at: null,
                error_message: null,
                retry_count: 0,
                processing_time_seconds: null
              }))
            );

          if (phasesError) {
            console.error('❌ Failed to create pipeline phases:', phasesError);
          } else {
            console.log('✅ Pipeline phases created');
          }

          // 3a. Save additional product info to analysis table if provided
          if (brand || category) {
            try {
              await supabase
                .from('product_analysis_data')
                .insert({
                  product_id: product.id,
                  product_name: productName,
                  model: model,
                  confidence: 0,
                  detected_brands: brand ? [brand] : [],
                  detected_categories: category ? [category] : [],
                  color_analysis: {},
                  image_quality_score: 0,
                  completeness_score: 0
                });
              console.log('✅ Additional product info saved to analysis table');
            } catch (analysisError) {
              console.warn('❌ Failed to save additional product info:', analysisError);
            }
          }

          // 4. Start Phase 1 using RPC function
          const statusData4 = JSON.stringify({
            type: 'status',
            message: 'Starting AI analysis...'
          });
          controller.enqueue(encoder.encode(statusData4 + '\n'));

          try {
            const { error: rpcError } = await supabase.rpc('start_phase', {
              p_product_id: product.id,
              p_phase_number: 1
            });

            if (rpcError) {
              console.warn('RPC start_phase failed:', rpcError);
              // Manually update phase 1 to running
              await supabase
                .from('pipeline_phases')
                .update({
                  status: 'running',
                  started_at: new Date().toISOString()
                })
                .eq('product_id', product.id)
                .eq('phase_number', 1);
            }
          } catch (startError) {
            console.warn('Failed to start phase:', startError);
          }

          // 5. Log the upload event
          try {
            await supabase
              .from('pipeline_logs')
              .insert({
                product_id: product.id,
                phase_number: 1,
                log_level: 'info',
                message: 'Product upload completed successfully',
                action: 'product_upload',
                details: {
                  imageCount: files.length,
                  productName: product.name,
                  userId: demoUserId
                }
              });
          } catch (logError) {
            console.warn('Failed to log event:', logError);
          }

          // Send analysis result (simulated)
          const analysisData = JSON.stringify({
            type: 'analysis',
            result: {
              model: productName || 'Unknown Product',
              brand: brand || 'Unknown Brand',
              confidence: 0.85,
              category: category || 'General'
            }
          });
          controller.enqueue(encoder.encode(analysisData + '\n'));

          // Send completion
          const completeData = JSON.stringify({
            type: 'complete',
            result: {
              success: true,
              productId: product.id,
              message: 'Upload completed successfully!',
              imageUrls: imageUrls
            }
          });
          controller.enqueue(encoder.encode(completeData + '\n'));
          
          controller.close();

        } catch (error) {
          console.error('❌ Streaming error:', error);
          
          const errorData = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Upload failed'
          });
          controller.enqueue(encoder.encode(errorData + '\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in POST route:', error);
    return Response.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🎯 GET route hit!');
  
  return Response.json({
    success: true,
    message: 'GET route is working! The API endpoint exists.'
  });
}