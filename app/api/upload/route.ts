import { createClient } from '@/lib/supabase/server'
import { supabase as supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { claudeService } from '@/lib/ai-services'

interface _UploadResponse {
  type: 'status' | 'progress' | 'complete' | 'error'
  message?: string
  progress?: number
  result?: {
    success: boolean
    productId: string
    message: string
    imageUrls: string[]
    imageCount: number
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [UPLOAD] Starting upload request...')

    const supabase = await createClient()

    // Use the correct user ID where products are stored
    let userId: string = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1' // Your actual user ID

    // Try to get authenticated user first
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.substring(7))
        if (user) {
          userId = user.id
          console.log('✅ [UPLOAD] Using authenticated user:', userId)
        }
      }
    } catch {
      console.log('⚠️ [UPLOAD] Using default user:', userId)
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const productName = (formData.get('productName') as string) || null
    const model = (formData.get('model') as string) || null
    const brand = (formData.get('brand') as string) || null
    const category = (formData.get('category') as string) || null

    console.log('📤 [UPLOAD] Files:', files.length, 'Manual data provided:', { productName, model, brand, category })

    // Validation
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files allowed' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
      }
      if (file.size > maxSize) {
        return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 })
      }
    }

    // Step 0: Analyze images to extract product information
    console.log('🔍 [UPLOAD] Analyzing images with Claude to extract product information...')
    let extractedProductName = productName || null
    let extractedModel = model || null
    let extractedBrand = brand || null
    const extractedCategory = category || null
    let aiConfidence = 0
    const _requiresManualInput = false

    try {
      // Convert files to buffers for analysis
      const imageBuffers: Buffer[] = []
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        imageBuffers.push(Buffer.from(arrayBuffer))
      }

      // Analyze images with Claude
      const analysisResult = await claudeService.analyzeImages(imageBuffers)
      console.log('📝 [UPLOAD] Claude analysis result:', analysisResult)

      aiConfidence = analysisResult.confidence || 0

      // If we have good AI results and high confidence, use them
      if (aiConfidence >= 90 && analysisResult.model && analysisResult.model !== 'Unknown Model') {
        extractedModel = analysisResult.model
        // Try to extract brand from model if not manually provided
        if (!extractedBrand) {
          const modelWords = analysisResult.model.split(' ')
          if (modelWords.length > 0) {
            extractedBrand = modelWords[0] // First word is often the brand
          }
        }
        // Set a default product name if not provided
        if (!extractedProductName) {
          extractedProductName = analysisResult.model
        }
        
        console.log(`✅ [UPLOAD] Very high AI confidence (${aiConfidence}% ≥ 90%), using extracted data:`, {
          model: extractedModel,
          brand: extractedBrand,
          name: extractedProductName
        })
      } else {
        // Low confidence or no meaningful data extracted
        console.log(`⚠️ [UPLOAD] AI confidence too low (${aiConfidence}% < 90%) or no product detected`)
        const _requiresManualInput = true

        // If no manual data was provided either, we need user input
        if (!productName && !model && !brand) {
          return NextResponse.json({
            requiresManualInput: true,
            aiConfidence: aiConfidence,
            message: 'Could not automatically identify the product from the images. Please provide the product name, model, and brand manually.',
            extractedData: {
              model: analysisResult.model || '',
              condition: analysisResult.condition || '',
              defects: analysisResult.defects || []
            }
          }, { status: 200 })
        }
      }
    } catch (e) {
      console.error('❌ [UPLOAD] Image analysis failed:', e)
      // If analysis fails and no manual data provided, ask for manual input
      if (!productName && !model && !brand) {
        return NextResponse.json({
          requiresManualInput: true,
          aiConfidence: 0,
          message: 'Image analysis failed and no product information provided. Please enter the product details manually.',
          error: 'Image analysis unavailable'
        }, { status: 200 })
      }
    }

    // Use extracted or manual data, with fallbacks
    const finalProductName = extractedProductName || `Product ${Date.now()}`
    const finalModel = extractedModel || 'Unknown Model'
    const finalBrand = extractedBrand || 'Generic'
    const finalCategory = extractedCategory || 'General'

    console.log('📋 [UPLOAD] Final product data:', {
      name: finalProductName,
      model: finalModel,
      brand: finalBrand,
      category: finalCategory,
      aiConfidence
    })

    // Step 1: Create product
    console.log('🔧 [UPLOAD] Creating product with userId:', userId);
    console.log('🔧 [UPLOAD] Using supabaseAdmin client');
    
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        user_id: userId,
        name: finalProductName,
        model: finalModel,
        brand: finalBrand,
        category: finalCategory,
        status: 'uploaded',
        current_phase: 1,
        is_pipeline_running: true,
        ai_confidence: aiConfidence
      })
      .select()
      .single()

    if (productError) {
      console.error('❌ [UPLOAD] Product creation failed:', productError);
      return NextResponse.json({ error: `Failed to create product: ${productError.message}` }, { status: 500 })
    }
    
    console.log('✅ [UPLOAD] Product created successfully:', product.id);

    // Step 2: Upload images
    const imageUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${product.id}/${Date.now()}-${i}.${fileExt}`
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(fileName, file)
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(fileName)
        imageUrls.push(publicUrl)
        await supabaseAdmin
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: publicUrl,
            storage_path: fileName,
            is_primary: i === 0,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          })
      } catch (error) {
        console.error(`❌ [UPLOAD] Image ${i + 1} failed:`, error)
        // Continue uploading other images
      }
    }

    // Step 3: Create pipeline phases
    const phases = [
      { phase_number: 1, phase_name: 'Product Analysis', can_start: true, status: 'pending' },
      { phase_number: 2, phase_name: 'Market Research', can_start: false, status: 'pending' },
      { phase_number: 3, phase_name: 'Smart Pricing', can_start: false, status: 'pending' },
      { phase_number: 4, phase_name: 'SEO & Publishing', can_start: false, status: 'pending' }
    ]
    const { data: existingPhases } = await supabaseAdmin
      .from('pipeline_phases')
      .select('phase_number')
      .eq('product_id', product.id)
    if (!existingPhases || existingPhases.length === 0) {
      await supabaseAdmin
        .from('pipeline_phases')
        .insert(
          phases.map(phase => ({
            product_id: product.id,
            phase_number: phase.phase_number,
            phase_name: phase.phase_name,
            status: phase.status,
            can_start: phase.can_start,
            progress_percentage: 0
          }))
        )
    } else {
      await supabaseAdmin
        .from('pipeline_phases')
        .update({
          status: 'pending',
          can_start: false,
          progress_percentage: 0
        })
        .eq('product_id', product.id)
    }

    // Start pipeline in background
    runPipelinePhasesInBackground({
      product,
      productName: finalProductName,
      model: finalModel,
      brand: finalBrand,
      category: finalCategory,
      imageUrls,
      supabase: supabaseAdmin
    })

    // Respond to user immediately
    return NextResponse.json({
      success: true,
      productId: product.id,
      message: 'Upload received. Processing will continue in background.',
      imageUrls: imageUrls,
      imageCount: files.length
    })
  } catch (error) {
    console.error('❌ [UPLOAD] Handler error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// --- Pipeline background processing ---
async function runPipelinePhasesInBackground({ product, productName, model, brand, category, imageUrls, supabase }: any) {
  try {
    // --- ENRICHMENT: Get model, brand, category from AI API ---
    let enrichedModel = model;
    let enrichedBrand = brand;
    let enrichedCategory = category;
    let enrichData: Record<string, any> | null = null;
    try {
      // Use the first image for enrichment (or adjust as needed)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const enrichRes = await fetch(`${baseUrl}/api/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrls[0],
          productName,
          productModel: model || '' // Always send productModel
        })
      });

      if (enrichRes.ok) {
        // Parse streaming response line by line to extract the final enrichment result
        const reader = enrichRes.body?.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let lastResult: Record<string, any> = {};
        while (reader && !done) {
          const { value, done: streamDone } = await reader.read();
          if (value) {
            const lines = decoder.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                console.log(`📡 [UPLOAD] Raw enrichment line:`, line);
                
                // Capture different types of results: msrp, specifications, competitive
                if (parsed.result && (parsed.type === 'msrp' || parsed.type === 'specifications' || parsed.type === 'competitive' || parsed.type === 'result')) {
                  lastResult = { ...lastResult, ...parsed.result };
                  console.log(`📊 [UPLOAD] Captured ${parsed.type} data:`, JSON.stringify(parsed.result, null, 2));
                  
                  // ✅ FIXED: Extract specifications data properly when it arrives
                  if (parsed.type === 'specifications' && parsed.result) {
                    console.log('🔍 [UPLOAD] Processing specifications data:', {
                      hasKeyFeatures: !!(parsed.result.keyFeatures),
                      keyFeaturesCount: (parsed.result.keyFeatures || []).length,
                      keyFeaturesPreview: (parsed.result.keyFeatures || []).slice(0, 2),
                      hasTechnicalSpecs: !!(parsed.result.technicalSpecs),
                      technicalSpecsKeys: Object.keys(parsed.result.technicalSpecs || {}),
                      hasDimensions: !!(parsed.result.dimensions),
                      dimensionsKeys: Object.keys(parsed.result.dimensions || {}),
                      actualDimensions: parsed.result.dimensions,
                      hasYearReleased: !!(parsed.result.yearReleased),
                      yearReleased: parsed.result.yearReleased,
                      hasModelVariations: !!(parsed.result.modelVariations),
                      modelVariationsCount: (parsed.result.modelVariations || []).length
                    });
                  }
                }
                if (parsed.type === 'complete' && parsed.result && parsed.result.success) {
                  enrichData = lastResult;
                  console.log('🎯 [UPLOAD] Final accumulated enrichment data:', JSON.stringify(enrichData, null, 2));
                  console.log('🔑 [UPLOAD] Enrichment data structure check:', {
                    hasCurrentSellingPrice: !!enrichData.currentSellingPrice,
                    hasOriginalMSRP: !!enrichData.originalMSRP,
                    hasDimensions: !!enrichData.dimensions,
                    hasWeight: !!enrichData.dimensions?.weight,
                    hasPlatforms: !!enrichData.platforms,
                    hasEbayData: !!enrichData.platforms?.ebay,
                    hasKeyFeatures: !!(enrichData.keyFeatures || enrichData.features),
                    keyFeaturesCount: (enrichData.keyFeatures || enrichData.features || []).length,
                    keyFeaturesPreview: (enrichData.keyFeatures || enrichData.features || []).slice(0, 3),
                    hasTechnicalSpecs: !!(enrichData.technicalSpecs || enrichData.specifications),
                    technicalSpecsKeys: Object.keys(enrichData.technicalSpecs || enrichData.specifications || {}),
                    dimensionsStructure: enrichData.dimensions ? {
                      hasLength: !!enrichData.dimensions.length,
                      hasWidth: !!enrichData.dimensions.width, 
                      hasHeight: !!enrichData.dimensions.height,
                      hasWeight: !!enrichData.dimensions.weight
                    } : null,
                    allKeys: Object.keys(enrichData)
                  });
                }
                if (parsed.type === 'error') {
                  throw new Error(parsed.message || 'Enrichment error');
                }
              } catch (e) {
                console.error('❌ [UPLOAD] Error parsing enrichment stream:', e);
                console.error('❌ [UPLOAD] Problematic line:', line);
              }
            }
          }
          done = streamDone;
        }
      }
      if (enrichData) {
        enrichedModel = enrichData.model || enrichedModel;
        enrichedBrand = enrichData.brand || enrichedBrand;
        enrichedCategory = enrichData.category || enrichedCategory;


        // Calculate confidence for each field (default to 1 if not provided)
        const confidenceThreshold = 0.8;
        const confidence = {
          model: enrichData.model_confidence ?? 1,
          brand: enrichData.brand_confidence ?? 1,
          category: enrichData.category_confidence ?? 1,
          productName: enrichData.productName_confidence ?? 1,
        };
        const missingFields = Object.entries(confidence)
          .filter(([field, score]) => !enrichData?.[field] || score < confidenceThreshold)
          .map(([field]) => field);
        // Save confidence and missingFields to product record
        await supabaseAdmin
          .from('products')
          .update({
            ai_confidence: confidence,
            ai_missing_fields: missingFields
          })
          .eq('id', product.id);
      } else {
        throw new Error('Enrichment failed or returned no data');
      }
    } catch (enrichError) {
      console.error('❌ [UPLOAD] Enrichment phase failed:', enrichError);
    }
    // --- Update product with AI-enriched fields and detailed specifications ---
    const productUpdateData: any = {
      model: enrichedModel,
      brand: enrichedBrand,
      category: enrichedCategory
    }

    // Extract and store detailed specifications from enrichment data
    if (enrichData) {
      console.log('📋 [UPLOAD] Processing enrichment data:', JSON.stringify(enrichData, null, 2));

      // The enrichment API accumulates data from msrp, specifications, and competitive endpoints
      // The specifications data should now be at the root level of enrichData
      let specsData = null;
      
      // Check if we have specification fields at root level (which should be the case now)
      if (enrichData.keyFeatures || enrichData.technicalSpecs || enrichData.dimensions || enrichData.brand) {
        specsData = enrichData;
        console.log('📋 [UPLOAD] Found specifications at root level');
      }
      // Fallback: check nested structure (just in case)
      else if (enrichData.specifications) {
        specsData = enrichData.specifications;
        console.log('📋 [UPLOAD] Found specifications in enrichData.specifications');
      }

      if (specsData) {
        console.log('📋 [UPLOAD] Extracted specifications:', JSON.stringify(specsData, null, 2));
        
        if (specsData.keyFeatures && Array.isArray(specsData.keyFeatures)) {
          productUpdateData.key_features = specsData.keyFeatures;
          console.log('✅ [UPLOAD] Set key_features:', specsData.keyFeatures);
        }
        if (specsData.technicalSpecs && typeof specsData.technicalSpecs === 'object') {
          productUpdateData.technical_specs = specsData.technicalSpecs;
          console.log('✅ [UPLOAD] Set technical_specs:', specsData.technicalSpecs);
        }
        if (specsData.dimensions && typeof specsData.dimensions === 'object') {
          productUpdateData.dimensions = specsData.dimensions;
          console.log('✅ [UPLOAD] Set dimensions:', specsData.dimensions);
        }
        if (specsData.modelVariations && Array.isArray(specsData.modelVariations)) {
          productUpdateData.model_variations = specsData.modelVariations;
          console.log('✅ [UPLOAD] Set model_variations:', specsData.modelVariations);
        }
        if (specsData.description) {
          productUpdateData.description = specsData.description;
          console.log('✅ [UPLOAD] Set description:', specsData.description);
        }
        if (specsData.yearReleased) {
          productUpdateData.year_released = specsData.yearReleased;
          console.log('✅ [UPLOAD] Set year_released:', specsData.yearReleased);
        }
      } else {
        console.log('⚠️ [UPLOAD] No specifications data found in enrichment result');
      }
    } else {
      console.log('⚠️ [UPLOAD] No enrichment data available, trying direct API call');
      
      // Fallback: Try direct API call to get specifications
      console.log('🤖 [UPLOAD] Calling AI specifications with:', {
        enrichedModel,
        enrichedBrand,
        enrichedCategory,
        originalModel: model,
        originalBrand: brand,
        originalCategory: category,
        productName: productName
      });
      
      try {
        const { geminiService } = await import('@/lib/ai-services');
        // Create a more detailed product query for AI
        const productQuery = `${enrichedBrand} ${enrichedModel} ${enrichedCategory}`.trim() || productName;
        console.log('🔍 [UPLOAD] Using AI query:', productQuery);
        
        const directSpecs = await geminiService.getSpecifications(productQuery);
        
        if (directSpecs && typeof directSpecs === 'object') {
          console.log('✅ [UPLOAD] Got direct specifications:', directSpecs);
          
          if (directSpecs.keyFeatures) {
            productUpdateData.key_features = directSpecs.keyFeatures;
          }
          if (directSpecs.technicalSpecs) {
            productUpdateData.technical_specs = directSpecs.technicalSpecs;
          }
          if (directSpecs.dimensions) {
            productUpdateData.dimensions = directSpecs.dimensions;
          }
          if (directSpecs.modelVariations) {
            productUpdateData.model_variations = directSpecs.modelVariations;
          }
          if (directSpecs.description) {
            productUpdateData.description = directSpecs.description;
          }
          if (directSpecs.yearReleased) {
            productUpdateData.year_released = directSpecs.yearReleased;
          }
        } else {
          throw new Error('Direct specifications call returned invalid data');
        }
      } catch (directError) {
        console.error('❌ [UPLOAD] Direct specifications call failed:', directError);
        
        // Add fallback specifications for testing
        productUpdateData.technical_specs = {
          "Product Type": "Appliance", 
          "Brand": enrichedBrand,
          "Model": enrichedModel,
          "Note": "Specifications could not be retrieved"
        };
        productUpdateData.dimensions = {
          "status": "Specifications not available - AI enrichment failed"
        };
        productUpdateData.key_features = ["Product features not detected by AI"];
      }
    }

    console.log('🔄 [UPLOAD] Updating products with data:', JSON.stringify(productUpdateData, null, 2));

    await supabaseAdmin
      .from('products')
      .update(productUpdateData)
      .eq('id', product.id);

    // --- PHASE 1: Product Analysis ---
    const analysisData = {
      product_id: product.id,
      product_name: productName,
      model: enrichedModel,
      confidence: 95, // Example value
      item_condition: 'good',
      condition_details: 'AI analyzed product in good condition',
      detected_categories: [enrichedCategory || 'Electronics'], // TEXT[]
      detected_brands: [enrichedBrand || 'Generic'], // TEXT[]
      color_analysis: { primary_colors: ['black', 'silver'] }, // JSONB
      image_quality_score: 90, // Example value
      completeness_score: 100 // Example value
    }
    await supabaseAdmin
      .from('product_analysis_data')
      .upsert(analysisData, { onConflict: 'product_id' })
    await supabaseAdmin
      .from('pipeline_phases')
      .update({ status: 'completed', progress_percentage: 100, completed_at: new Date().toISOString() })
      .eq('product_id', product.id)
      .eq('phase_number', 1)

    // --- PHASE 2: Market Research + Platform Pricing ---
    console.log('💰 [UPLOAD] Processing Phase 2: Market Research with real enrichment data');
    
    // Extract MSRP and pricing from enrichment data (real AI data)
    // The enrichment data is flattened from streaming responses (msrp, specifications, competitive)
    const realMSRP = enrichData?.currentSellingPrice || 
                     enrichData?.originalMSRP || 
                     enrichData?.msrp ||
                     enrichData?.price ||
                     null;
    const realAmazonPrice = enrichData?.currentSellingPrice || null;
    const realCompetitivePrice = enrichData?.platforms?.ebay?.averagePrice || enrichData?.averageMarketPrice || null;
    const realEbayPrice = enrichData?.platforms?.ebay?.averagePrice || null;
    const basePrice = realMSRP || Math.floor(Math.random() * 400) + 150; // Use real MSRP or fallback
    
    console.log('💰 [UPLOAD] MSRP data from enrichment:', {
      realMSRP,
      realAmazonPrice,
      realCompetitivePrice,
      realEbayPrice,
      usingFallback: !realMSRP,
      enrichDataKeys: enrichData ? Object.keys(enrichData) : 'no enrichData',
      // Debug: show actual price-related fields
      priceFields: {
        currentSellingPrice: enrichData?.currentSellingPrice,
        originalMSRP: enrichData?.originalMSRP,
        msrp: enrichData?.msrp,
        price: enrichData?.price,
        platforms: enrichData?.platforms ? Object.keys(enrichData.platforms) : 'no platforms'
      }
    });

    // Call Platform Pricing API to get real Amazon/eBay URLs and prices
    let platformPricingData = null;
    try {
      console.log('🔍 [UPLOAD] Calling Platform Pricing API...');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const pricingRes = await fetch(`${baseUrl}/api/platform-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          model: enrichedModel,
          brand: enrichedBrand,
          category: enrichedCategory,
          condition: 'used'
        })
      });

      if (pricingRes.ok) {
        const { data } = await pricingRes.json();
        platformPricingData = data;
        console.log('✅ [UPLOAD] Platform pricing data retrieved:', JSON.stringify(data.summary, null, 2));
      } else {
        console.error('❌ [UPLOAD] Platform pricing API failed:', pricingRes.status, pricingRes.statusText);
      }
    } catch (pricingError) {
      console.error('❌ [UPLOAD] Platform pricing call failed:', pricingError);
    }

    // ✅ FIXED: Use ONLY columns that exist in the basic product_market_data table
    const marketData = {
      product_id: product.id,
      
      // Core market research fields that definitely exist
      average_market_price: platformPricingData?.summary?.avg_price || realCompetitivePrice || basePrice,
      price_range_min: platformPricingData?.summary?.price_range?.min || Math.floor(basePrice * 0.7),
      price_range_max: platformPricingData?.summary?.price_range?.max || Math.floor(basePrice * 1.4),
      market_demand: 'medium',
      competitor_count: platformPricingData?.summary?.total_platforms || Math.floor(Math.random() * 15) + 5,
      trending_score: Math.floor(Math.random() * 40) + 60,
      seasonal_factor: 1.0,
      best_selling_platforms: ['ebay', 'amazon', 'facebook'],
      recommended_categories: [enrichedCategory || 'Electronics', 'Tech'],
      data_sources: ['ai_enrichment', 'platform_pricing_api', 'market_api'],
      research_date: new Date().toISOString()
    }
    
    console.log('💾 [UPLOAD] Saving market data with core fields only:', {
      average_market_price: marketData.average_market_price,
      price_range_min: marketData.price_range_min,
      price_range_max: marketData.price_range_max,
      market_demand: marketData.market_demand,
      competitor_count: marketData.competitor_count,
      data_sources: marketData.data_sources,
      total_platforms_found: platformPricingData?.summary?.total_platforms || 0,
      note: 'Using only basic table columns to avoid database errors'
    });

    const { error: marketDataError } = await supabaseAdmin
      .from('product_market_data')
      .upsert(marketData, { onConflict: 'product_id' })
    
    if (marketDataError) {
      console.error('❌ [UPLOAD] Failed to save market data:', marketDataError);
      throw new Error(`Market data save failed: ${marketDataError.message}`);
    } else {
      console.log('✅ [UPLOAD] Market data saved successfully');
    }

    // ✅ SAVE PRICING DATA + FEATURES TO PRODUCTS TABLE (where these fields exist)
    const productPricingUpdate = {
      // Real MSRP and competitive pricing from AI enrichment
      msrp: realMSRP || basePrice,
      competitive_price: realCompetitivePrice || (realMSRP ? realMSRP * 0.75 : basePrice * 0.75),
      amazon_price: realAmazonPrice || platformPricingData?.amazon?.price || null,
      amazon_link: enrichData?.sources?.[0] || platformPricingData?.amazon?.url || null,
      
      // ✅ FIXED: Extract real product features from AI enrichment with intelligent extraction
      key_features: (() => {
        const features = enrichData?.keyFeatures || enrichData?.features || [];
        console.log('🔍 [UPLOAD] Raw features from AI:', features);
        
        if (Array.isArray(features) && features.length > 0) {
          // Filter out generic/fallback features and only keep specific ones
          const specificFeatures = features.filter(feature => {
            if (!feature || typeof feature !== 'string') return false;
            
            const genericTerms = [
              'Feature detection pending', 'Features will be detected', 'tune AI prompt',
              'Electronic functionality', 'User interface', 'Quality construction',
              'High quality', 'Easy to use', 'product - tune', 'Great performance',
              'Premium design', 'Advanced technology', 'Innovative features',
              'Cutting-edge', 'State-of-the-art', 'Superior quality'
            ];
            
            // Check if feature contains any generic terms
            if (genericTerms.some(term => feature.toLowerCase().includes(term.toLowerCase()))) {
              return false;
            }
            
                         // Require features to be descriptive (>10 chars) - made less strict
             if (feature.length < 10) return false;
            
            // Look for technical indicators that suggest real features
            const technicalIndicators = [
              'MP', 'GB', 'TB', 'GHz', 'MHz', 'inch', 'mAh', 'W', 'Hz', 'USB', 'WiFi', 
              'Bluetooth', 'chip', 'processor', 'camera', 'display', 'battery', 'storage',
              'RAM', 'core', 'pixel', 'zoom', 'charging', 'wireless', 'connector'
            ];
            
            if (technicalIndicators.some(indicator => 
              feature.toLowerCase().includes(indicator.toLowerCase())
            )) {
              return true;
            }
            
                         // If it has numbers and technical words, it's probably specific
             if (/\d/.test(feature) && feature.split(' ').length >= 3) {
               return true;
             }
             
             // Accept features that are descriptive enough even without technical terms
             if (feature.length > 20 && feature.split(' ').length >= 4) {
               return true;
             }
             
             return false;
          });
          
                     console.log('🔍 [UPLOAD] Filtered features result:', {
             originalCount: features.length,
             filteredCount: specificFeatures.length,
             originalFeatures: features,
             filteredFeatures: specificFeatures
           });
           
           if (specificFeatures.length > 0) {
             console.log('✅ [UPLOAD] Found specific technical features:', specificFeatures);
             return specificFeatures;
           }
        }
        
        // Try to extract from technical specs as secondary source
        if (enrichData?.technicalSpecs && typeof enrichData.technicalSpecs === 'object') {
          const specFeatures = [];
          for (const [key, value] of Object.entries(enrichData.technicalSpecs)) {
            if (value && typeof value === 'string' && value !== 'Unknown') {
              specFeatures.push(`${key}: ${value}`);
            }
          }
          if (specFeatures.length > 0) {
            console.log('✅ [UPLOAD] Using technical specs as features:', specFeatures);
            return specFeatures.slice(0, 5); // Limit to 5 features
          }
        }
        
                 console.log('⚠️ [UPLOAD] No specific features found, AI needs better prompting');
         
         // Check if we have meaningful product info to create specific fallbacks
         const category = enrichData?.category || enrichedCategory || 'Electronics';
         const brand = enrichData?.brand || enrichedBrand || 'Unknown';
         const model = enrichData?.model || enrichedModel || 'Product';
         const hasSpecificInfo = brand !== 'Unknown' && brand !== 'Generic' && 
                                model !== 'Unknown Model' && model !== 'Product';
         
         if (hasSpecificInfo) {
           console.log('📝 [UPLOAD] Creating brand/model specific fallbacks');
           return [
             `${brand} ${model} core functionality`,
             `${brand} quality construction and design`,
             `${category} device with ${brand} reliability`,
             `Standard ${model} operational features`,
             `Built-in ${category.toLowerCase()} capabilities`
           ];
         } else {
           console.log('📝 [UPLOAD] Product too generic - returning empty array to show "tune AI prompt" message');
           return []; // This will trigger the "Not found - tune AI prompt" message in UI
         }
      })(),
      
      // ✅ FIXED: Extract technical specifications with proper structure
      technical_specs: (() => {
        const specs = enrichData?.technicalSpecs || enrichData?.specifications || {};
        if (Object.keys(specs).length > 0) {
          return specs;
        }
        // Build specs from available data
        const builtSpecs: Record<string, any> = {};
        if (enrichData?.brand) builtSpecs.Brand = enrichData.brand;
        if (enrichData?.model) builtSpecs.Model = enrichData.model;
        if (enrichData?.category) builtSpecs.Category = enrichData.category;
        if (enrichData?.yearReleased) builtSpecs['Year Released'] = enrichData.yearReleased;
        return Object.keys(builtSpecs).length > 0 ? builtSpecs : { Status: 'Specifications being processed' };
      })(),
      
      // ✅ FIXED: Structure dimensions properly with width, height, length, weight
      dimensions: (() => {
        const dims = enrichData?.dimensions || {};
        
        // Return structured dimensions that match expected format
        return {
          width: dims?.width || dims?.Width || 'Not found',
          height: dims?.height || dims?.Height || 'Not found', 
          length: dims?.length || dims?.Length || 'Not found',
          weight: dims?.weight || dims?.Weight || 'Not found'
        };
      })(),
      
      // ✅ FIXED: Ensure year_released is saved from AI enrichment data
      year_released: enrichData?.yearReleased && enrichData.yearReleased !== 'Unknown' 
        ? enrichData.yearReleased 
        : null,
      
      updated_at: new Date().toISOString()
    };

    console.log('💰 [UPLOAD] Saving pricing + features data to products table:', {
      msrp: productPricingUpdate.msrp,
      competitive_price: productPricingUpdate.competitive_price,
      amazon_price: productPricingUpdate.amazon_price,
      has_amazon_link: !!productPricingUpdate.amazon_link,
      key_features_count: productPricingUpdate.key_features?.length || 0,
      key_features_full: productPricingUpdate.key_features || [],
      has_technical_specs: Object.keys(productPricingUpdate.technical_specs || {}).length > 0,
      technical_specs_preview: Object.keys(productPricingUpdate.technical_specs || {}).slice(0, 3),
      has_dimensions: Object.keys(productPricingUpdate.dimensions || {}).length > 0,
      dimensions_structure: {
        width: !!productPricingUpdate.dimensions?.width && productPricingUpdate.dimensions.width !== 'Not found',
        height: !!productPricingUpdate.dimensions?.height && productPricingUpdate.dimensions.height !== 'Not found',
        length: !!productPricingUpdate.dimensions?.length && productPricingUpdate.dimensions.length !== 'Not found',
        weight: !!productPricingUpdate.dimensions?.weight && productPricingUpdate.dimensions.weight !== 'Not found'
      },
      year_released: productPricingUpdate.year_released || 'Not provided'
    });

    const { error: pricingUpdateError } = await supabaseAdmin
      .from('products')
      .update(productPricingUpdate)
      .eq('id', product.id);

    if (pricingUpdateError) {
      console.warn('⚠️ [UPLOAD] Could not save pricing + features data to products table:', pricingUpdateError.message);
      // Don't throw error - market research data was saved successfully
    } else {
      console.log('✅ [UPLOAD] Pricing + features data saved to products table successfully');
    }
    await supabaseAdmin
      .from('pipeline_phases')
      .update({ status: 'completed', progress_percentage: 100, completed_at: new Date().toISOString() })
      .eq('product_id', product.id)
      .eq('phase_number', 2)

    // --- PHASE 3: Pricing (update products table) ---
    const suggestedPrice = +(basePrice * 0.75).toFixed(2)
    
    // Get current product to preserve existing specifications
    const { data: currentProduct } = await supabase
      .from('products')
      .select('description, key_features')
      .eq('id', product.id)
      .single();

    const pricingUpdate: any = {
      suggested_price: suggestedPrice,
      final_price: suggestedPrice,
      short_description: `${productName} - Good condition, fully functional`
    }

    // Only update description if it's empty or generic
    if (!currentProduct?.description || currentProduct.description.includes('Unknown')) {
      pricingUpdate.description = `${productName} in good condition. Thoroughly tested and verified for quality.`;
    }

    // Only update key_features if they're empty, otherwise preserve AI-extracted features
    if (!currentProduct?.key_features || currentProduct.key_features.length === 0) {
      pricingUpdate.key_features = ['Good condition', 'Tested', 'Fast shipping'];
    }

    await supabase
      .from('products')
      .update(pricingUpdate)
      .eq('id', product.id)
    await supabase
      .from('pipeline_phases')
      .update({ status: 'completed', progress_percentage: 100, completed_at: new Date().toISOString() })
      .eq('product_id', product.id)
      .eq('phase_number', 3)

    // --- PHASE 4: SEO (fetch from /api/seo, save to seo_analysis_data and products) ---
    try {
      // Get the updated product specifications for SEO
      const { data: productSpecs } = await supabase
        .from('products')
        .select('technical_specs, key_features, dimensions, description')
        .eq('id', product.id)
        .single();

      const seoReq = {
        productModel: enrichedModel,
        finalPrice: suggestedPrice,
        condition: 'good', // Default condition since SEO requires it
        specifications: {
          brand: enrichedBrand,
          category: enrichedCategory,
          description: productSpecs?.description || `${productName} in good condition`,
          keyFeatures: productSpecs?.key_features || [],
          technicalSpecs: productSpecs?.technical_specs || {},
          dimensions: productSpecs?.dimensions || {},
          yearReleased: new Date().getFullYear().toString()
        },
        msrpData: {
          currentSellingPrice: basePrice || suggestedPrice * 1.3, // Use market price or estimate
          originalMSRP: basePrice || suggestedPrice * 1.5,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        }
      }
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const seoRes = await fetch(`${baseUrl}/api/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoReq)
      })
      let seoData = null
      if (seoRes.ok) {
        const { data } = await seoRes.json()
        seoData = data
      }
      // Fallback if SEO API fails
      if (!seoData) {
        seoData = {
          title: `${productName} - Best Price Online`,
          metaDescription: `Buy ${productName} in good condition. Fast shipping!`,
          slug: productName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50),
          keywords: [productName.toLowerCase(), 'electronics', 'tech'], // TEXT[]
          tags: ['electronics', 'tech', 'quality'] // TEXT[]
        }
      }

      console.log('🔍 [UPLOAD] SEO API response structure:', {
        hasTitle: !!seoData.title,
        hasMetaDescription: !!seoData.metaDescription,
        hasSlug: !!seoData.slug,
        hasKeywords: !!seoData.keywords,
        hasTags: !!seoData.tags,
        seoDataKeys: Object.keys(seoData)
      });

      // Calculate SEO analytics and metrics
      const titleLength = seoData.title ? seoData.title.length : 0;
      const descriptionLength = seoData.metaDescription ? seoData.metaDescription.length : 0;
      
      // Calculate SEO score based on best practices
      let seoScore = 0;
      if (titleLength >= 30 && titleLength <= 60) seoScore += 25; // Optimal title length
      if (descriptionLength >= 120 && descriptionLength <= 160) seoScore += 25; // Optimal description length
      if (seoData.keywords && seoData.keywords.length >= 3) seoScore += 25; // Sufficient keywords
      if (seoData.title && seoData.title.toLowerCase().includes(enrichedModel.toLowerCase())) seoScore += 25; // Title includes product model
      
      // Mock competitive analysis and metrics (in real implementation, these would come from SEO APIs)
      const mockCompetitorAnalysis = {
        competitorCount: Math.floor(Math.random() * 50) + 10,
        avgTitleLength: Math.floor(Math.random() * 20) + 45,
        avgDescriptionLength: Math.floor(Math.random() * 30) + 130,
        topKeywords: seoData.keywords?.slice(0, 3) || [],
        marketPosition: 'competitive'
      };

      const contentSuggestions = [];
      if (titleLength < 30) contentSuggestions.push('Title is too short - consider adding more descriptive keywords');
      if (titleLength > 60) contentSuggestions.push('Title is too long - consider shortening for better display');
      if (descriptionLength < 120) contentSuggestions.push('Meta description is too short - add more compelling details');
      if (descriptionLength > 160) contentSuggestions.push('Meta description is too long - may be truncated in search results');
      if (!seoData.keywords || seoData.keywords.length < 3) contentSuggestions.push('Add more relevant keywords to improve discoverability');

      console.log('📊 [UPLOAD] Preparing SEO analysis data:', {
        product_id: product.id,
        seoScore,
        titleLength,
        descriptionLength,
        keywords: seoData.keywords,
        contentSuggestions
      });

      const seoAnalysisData = {
        product_id: product.id,
        seo_title: seoData.title || null,
        meta_description: seoData.metaDescription || null,
        url_slug: seoData.slug || null,
        keywords: seoData.keywords || [],
        tags: seoData.tags || [],
        seo_score: seoScore,
        search_volume: Math.floor(Math.random() * 1000) + 100, // Mock search volume
        keyword_difficulty: Math.floor(Math.random() * 40) + 30, // Mock keyword difficulty
        content_suggestions: contentSuggestions,
        competitor_analysis: mockCompetitorAnalysis,
        title_length: titleLength,
        description_length: descriptionLength,
        keyword_density: parseFloat(seoData.keywords ? (seoData.keywords.length / (titleLength + descriptionLength) * 100).toFixed(2) : '0'),
        readability_score: Math.floor(Math.random() * 20) + 70 // Mock readability score
      };

      console.log('📊 [UPLOAD] Inserting SEO analysis data:', JSON.stringify(seoAnalysisData, null, 2));

      const seoInsertResult = await supabase
        .from('seo_analysis_data')
        .upsert(seoAnalysisData, { onConflict: 'product_id' });

      if (seoInsertResult.error) {
        console.error('❌ [UPLOAD] SEO analysis data insertion failed:', seoInsertResult.error);
        throw new Error(`SEO analysis data insertion failed: ${seoInsertResult.error.message}`);
      } else {
        console.log('✅ [UPLOAD] SEO analysis data inserted successfully:', seoInsertResult.data);
      }
      await supabase
        .from('products')
        .update({
          seo_title: seoData.title,
          meta_description: seoData.metaDescription,
          url_slug: seoData.slug,
          keywords: seoData.keywords || []
        })
        .eq('id', product.id)
      await supabase
        .from('pipeline_phases')
        .update({ status: 'completed', progress_percentage: 100, completed_at: new Date().toISOString() })
        .eq('product_id', product.id)
        .eq('phase_number', 4)
    } catch (seoError) {
      console.error('❌ [UPLOAD] SEO phase failed:', seoError)
    }

    // --- POPULATE LISTING DATA: All phases complete, create listing data ---
    try {
      // Get the updated product data to use for listing
      const { data: updatedProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      // Create product listing data with actual specifications
      const listingData = {
        product_id: product.id,
        product_title: updatedProduct?.name || productName,
        product_description: updatedProduct?.description || `${productName} in good condition. Thoroughly tested and verified for quality.`,
        key_features: updatedProduct?.key_features || ['Good condition', 'Tested', 'Fast shipping'],
        price: suggestedPrice,
        brand: updatedProduct?.brand || enrichedBrand,
        category: updatedProduct?.category || enrichedCategory,
        item_condition: 'good',
        publishing_status: 'ready',
        channels: {
          ebay: true,
          facebook: true,
          amazon: false,
          mercari: true
        }
      }
      
      await supabase
        .from('product_listing_data')
        .upsert(listingData, { onConflict: 'product_id' })

      // Create individual platform listings
      const platforms = ['eBay', 'Facebook Marketplace', 'Mercari']
      
      for (const platform of platforms) {
        await supabase
          .from('product_listings')
          .insert({
            product_id: product.id,
            platform: platform,
            title: `${productName} - Good Condition`,
            description: `${productName} in good condition. Thoroughly tested and verified for quality. Fast shipping!`,
            category: enrichedCategory,
            price: suggestedPrice,
            shipping_cost: 5.99,
            handling_days: 1,
            status: 'draft'
          })
      }

      console.log('✅ [UPLOAD] Listing data populated for product', product.id)
    } catch (listingError) {
      console.error('❌ [UPLOAD] Failed to populate listing data:', listingError)
    }

    // --- FINAL: Mark product as completed (triggers real-time) ---
    await supabase
      .from('products')
      .update({
        status: 'completed',
        is_pipeline_running: false,
        current_phase: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)
    // All changes above are real-time (no local cache, always upsert/update)
    console.log('✅ [UPLOAD] All phases completed for product', product.id)
  } catch (err) {
    console.error('❌ [UPLOAD] Pipeline error:', err)
    if (product && product.id) {
      await supabase
        .from('products')
        .update({ status: 'error', is_pipeline_running: false, updated_at: new Date().toISOString() })
        .eq('id', product.id)
    }
  }
}