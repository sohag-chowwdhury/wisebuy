import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    console.log(`🔍 [MERGED-DATA] Fetching merged data for product: ${productId}`);

    // Fetch data from all tables in parallel for better performance
    const [productResult, marketResearchResult, seoAnalysisResult, productImagesResult] = await Promise.all([
      // 1. Fetch main product data
      supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single(),

      // 2. Fetch market research data
      supabaseAdmin
        .from('market_research_data')
        .select('*')
        .eq('product_id', productId)
        .single(),

      // 3. Fetch SEO analysis data
      supabaseAdmin
        .from('seo_analysis_data')
        .select('*')
        .eq('product_id', productId)
        .single(),

      // 4. Fetch product images
      supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })
    ]);

    // Check for errors in main product fetch (required)
    if (productResult.error) {
      console.error('❌ [MERGED-DATA] Error fetching product:', productResult.error);
      return NextResponse.json(
        { error: `Product not found: ${productResult.error.message}` },
        { status: 404 }
      );
    }

    const product = productResult.data;

    // Market research and SEO data may not exist yet, so handle gracefully
    const marketResearchData = marketResearchResult.error ? null : marketResearchResult.data;
    const seoAnalysisData = seoAnalysisResult.error ? null : seoAnalysisResult.data;
    const productImages = productImagesResult.error ? [] : productImagesResult.data;

    // Log what data we found
    console.log(`✅ [MERGED-DATA] Product found: ${product.name}`);
    console.log(`📊 [MERGED-DATA] Market research data: ${marketResearchData ? 'Found' : 'Not found'}`);
    console.log(`🔍 [MERGED-DATA] SEO analysis data: ${seoAnalysisData ? 'Found' : 'Not found'}`);
    console.log(`📸 [MERGED-DATA] Product images: ${productImages.length} found`);

    // Create the merged data object
    const mergedData = {
      // Product Information (Phase 1)
      productInfo: {
        id: product.id,
        name: product.name,
        model: product.model,
        brand: product.brand,
        category: product.category,
        description: product.description,
        yearReleased: product.year_released,
        status: product.status,
        currentPhase: product.current_phase,
        aiConfidence: product.ai_confidence,
        keyFeatures: product.key_features || [],
        technicalSpecs: product.technical_specs || {},
        dimensions: product.dimensions || {},
        modelVariations: product.model_variations || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at
      },

      // Product Images
      images: productImages.map(img => ({
        id: img.id,
        imageUrl: img.image_url,
        storagePath: img.storage_path,
        fileName: img.file_name,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        isPrimary: img.is_primary,
        width: img.width,
        height: img.height,
        qualityScore: img.quality_score,
        createdAt: img.created_at
      })),

      // Market Research Information (Phase 2) - Get pricing from products table + market research data
      marketResearch: marketResearchData || product.msrp || product.amazon_price ? {
        // Get pricing data from products table (where it's actually stored) with fallbacks
        amazonPrice: product.amazon_price || marketResearchData?.amazon_price || 0,
        amazonLink: product.amazon_link || marketResearchData?.amazon_link || marketResearchData?.amazon_url || "",
        ebayPrice: marketResearchData?.ebay_price || 0,
        ebayLink: marketResearchData?.ebay_link || marketResearchData?.ebay_url || "",
        msrp: product.msrp || marketResearchData?.msrp || 0,
        competitivePrice: product.competitive_price || marketResearchData?.competitive_price || 0,
        brand: marketResearchData?.brand || product.brand || "Unknown",
        category: marketResearchData?.category || product.category || "General",
        year: marketResearchData?.year || product.year_released || "Unknown",
        weight: marketResearchData?.weight || "Unknown",
        dimensions: marketResearchData?.dimensions || 
                   (product.dimensions ? JSON.stringify(product.dimensions) : "Unknown"),
        manufacturer: marketResearchData?.manufacturer || product.brand || "Unknown",
        modelNumber: marketResearchData?.model_number || product.model || "Unknown",
        color: marketResearchData?.color || null,
        material: marketResearchData?.material || null,
        createdAt: marketResearchData?.created_at || product.created_at,
        updatedAt: marketResearchData?.updated_at || product.updated_at
      } : null,

      // SEO Analysis Information (Phase 4)
      seoAnalysis: seoAnalysisData ? {
        seoTitle: seoAnalysisData.seo_title,
        metaDescription: seoAnalysisData.meta_description,
        urlSlug: seoAnalysisData.url_slug,
        keywords: seoAnalysisData.keywords || [],
        tags: seoAnalysisData.tags || [],
        seoScore: seoAnalysisData.seo_score,
        searchVolume: seoAnalysisData.search_volume,
        keywordDifficulty: seoAnalysisData.keyword_difficulty,
        contentSuggestions: seoAnalysisData.content_suggestions || [],
        competitorAnalysis: seoAnalysisData.competitor_analysis || {},
        titleLength: seoAnalysisData.title_length,
        descriptionLength: seoAnalysisData.description_length,
        keywordDensity: seoAnalysisData.keyword_density,
        readabilityScore: seoAnalysisData.readability_score,
        createdAt: seoAnalysisData.created_at,
        updatedAt: seoAnalysisData.updated_at
      } : null,

      // Summary Statistics
      summary: {
        completedPhases: [
          product.status !== 'uploaded' ? 1 : null, // Phase 1: Product Analysis
          marketResearchData ? 2 : null,            // Phase 2: Market Research
          product.current_phase >= 3 ? 3 : null,    // Phase 3: Product Listing (assumed)
          seoAnalysisData ? 4 : null                 // Phase 4: SEO Analysis
        ].filter(Boolean),
        totalPhases: 4,
        completionPercentage: Math.round(([
          product.status !== 'uploaded' ? 1 : 0,
          marketResearchData ? 1 : 0,
          product.current_phase >= 3 ? 1 : 0,
          seoAnalysisData ? 1 : 0
        ].reduce((a, b) => a + b, 0) / 4) * 100),
        hasMarketData: !!marketResearchData,
        hasSeoData: !!seoAnalysisData,
        hasImages: productImages.length > 0,
        imageCount: productImages.length,
        primaryImage: productImages.find(img => img.is_primary)?.image_url || productImages[0]?.image_url || null,
        dataCompleteness: {
          product: true, // Always have product data if we get this far
          marketResearch: !!marketResearchData,
          seoAnalysis: !!seoAnalysisData,
          images: productImages.length > 0
        }
      }
    };

    console.log(`✅ [MERGED-DATA] Merged data created successfully - ${mergedData.summary.completionPercentage}% complete`);

    return NextResponse.json({
      success: true,
      data: mergedData,
      message: `Product data merged successfully - ${mergedData.summary.completedPhases.length}/4 phases completed`
    });

  } catch (error) {
    console.error('❌ [MERGED-DATA] Error fetching merged data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch merged product data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 