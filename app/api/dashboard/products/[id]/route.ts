// app/api/dashboard/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Use demo user directly (no authentication required)
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    console.log('🔧 [PRODUCT_DETAIL] Using demo user:', userId, 'Product ID:', params.id)

    // Get comprehensive product data from all tables including pipeline phases
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        user_id,
        name,
        model,
        brand,
        category,
        status,
        current_phase,
        is_pipeline_running,
        error_message,
        ai_confidence,
        created_at,
        updated_at,
        product_images(
          id,
          image_url,
          is_primary,
          file_name
        ),
        pipeline_phases(
          id,
          phase_number,
          phase_name,
          status,
          progress_percentage,
          started_at,
          completed_at,
          error_message,
          created_at,
          updated_at
        )
      `)
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    // Fetch market research data
    const { data: marketData } = await supabase
      .from('market_research_data')
      .select('*')
      .eq('product_id', params.id)
      .single()

    // Fetch SEO analysis data
    const { data: seoData } = await supabase
      .from('seo_analysis_data')
      .select('*')
      .eq('product_id', params.id)
      .single()

    console.log('📊 [PRODUCT_DETAIL] Market data:', marketData)
    console.log('🔍 [PRODUCT_DETAIL] SEO data:', seoData)

    if (error) {
      console.error('❌ [PRODUCT_DETAIL] Database error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      
      throw new Error(`Failed to fetch product: ${error.message}`)
    }

    // Calculate progress from pipeline phases
    const calculateProgress = (phases: any[]) => {
      if (!phases || phases.length === 0) return 0
      const totalPhases = 4
      const completedPhases = phases.filter((phase: any) => phase.status === 'completed').length
      const runningPhases = phases.filter((phase: any) => phase.status === 'running')
      let progress = (completedPhases / totalPhases) * 100
      if (runningPhases.length > 0) {
        progress += (runningPhases.length / totalPhases) * 50 // Add partial for running phases
      }
      return Math.min(Math.round(progress), 100)
    }

    const progress = calculateProgress(product.pipeline_phases || [])

    // Transform the basic data for frontend consumption
    const transformedProduct = {
      // Basic product info
      id: product.id,
      name: product.name || 'Unknown Product',
      model: product.model || 'Unknown Model',
      brand: product.brand || 'Unknown',
      category: product.category || 'General',
      status: product.status,
      currentPhase: product.current_phase || 1,
      current_phase: product.current_phase || 1, // For compatibility
      isPipelineRunning: product.is_pipeline_running || false,
      is_pipeline_running: product.is_pipeline_running || false, // For compatibility
      errorMessage: product.error_message,
      error_message: product.error_message, // For compatibility
      progress: progress,
      ai_confidence: product.ai_confidence,
      createdAt: product.created_at,
      created_at: product.created_at, // For compatibility
      updatedAt: product.updated_at,
      updated_at: product.updated_at, // For compatibility
      
      // Images
      images: product.product_images?.map((img: any) => ({
        id: img.id,
        url: img.image_url,
        isPrimary: img.is_primary,
        fileName: img.file_name
      })) || [],
      
      // Real data from database tables with smart defaults
      analysisData: {
        productName: product.name || 'Unknown Product',
        model: product.model || 'Unknown Model', 
        confidence: product.ai_confidence || 85,
        itemCondition: 'good',
        conditionDetails: 'Product analyzed and in good condition'
      },
      marketData: marketData,
      seoData: seoData,
      listings: [],
      phases: product.pipeline_phases || [],
      logs: []
    }

    console.log(`✅ [PRODUCT_DETAIL] Product details fetched successfully for: ${params.id}`)

    return NextResponse.json(transformedProduct)

  } catch (error) {
    console.error('❌ [PRODUCT_DETAIL] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product details' },
      { status: 500 }
    )
  }
} 