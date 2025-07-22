// app/api/dashboard/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Use demo user directly (no authentication required)
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    console.log('🔧 [PRODUCTS] Using demo user:', userId)

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    console.log('🔍 [PRODUCTS] Query params:', { status, search, page, limit })

    // Build query - include pipeline phases for progress calculation
    let query = supabase
      .from('products')
      .select(`
        id,
        user_id,
        name,
        model,
        status,
        current_phase,
        is_pipeline_running,
        error_message,
        brand,
        category,
        created_at,
        updated_at,
        ai_confidence,
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%`)
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (status && status !== 'all') {
      countQuery.eq('status', status)
    }
    if (search) {
      countQuery.or(`name.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const [{ data: products, error: productsError }, { count, error: countError }] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery
    ])

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (countError) {
      throw new Error(`Failed to fetch count: ${countError.message}`)
    }

    // Transform data to match dashboard interface
    const transformedProducts = (products || []).map((product: any) => {
      // Get primary image or first image
      const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0]

      // Calculate progress from pipeline phases
      const progress = calculateProgressFromPhases(product.pipeline_phases || [])

      return {
        id: product.id,
        name: product.name || 'Unknown Product',
        model: product.model || 'Unknown Model', 
        status: product.status,
        currentPhase: product.current_phase || 1,
        progress: progress,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        thumbnailUrl: primaryImage?.image_url,
        error: product.error_message,
        price: undefined, // Will be populated when we add market data
        platforms: getPlatformsFromProduct(product),
        brand: product.brand || 'Unknown',
        category: product.category || 'General',
        ai_confidence: product.ai_confidence,
        
        // Include pipeline phases for detailed progress tracking
        phases: product.pipeline_phases || [],
        
        // Placeholder for analysis data (will be populated when tables are ready)
        analysisData: undefined,
        marketData: undefined,
        seoData: undefined,
        listings: []
      }
    })

    console.log(`📦 [PRODUCTS] Fetched ${transformedProducts.length} products, total: ${count}`)

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('❌ [PRODUCTS] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Helper function to calculate progress from pipeline phases
function calculateProgressFromPhases(phases: any[]): number {
  if (!phases || phases.length === 0) return 0
  
  const totalPhases = 4 // We have 4 phases total
  const completedPhases = phases.filter((phase: any) => phase.status === 'completed').length
  const runningPhases = phases.filter((phase: any) => phase.status === 'running')
  
  // Base progress from completed phases
  let progress = (completedPhases / totalPhases) * 100
  
  // Add partial progress for currently running phases
  if (runningPhases.length > 0) {
    // Add 50% of the phase progress for running phases (assuming they're halfway done)
    const runningProgress = (runningPhases.length / totalPhases) * 50
    progress += runningProgress
  }
  
  return Math.min(Math.round(progress), 100)
}

// Helper function to calculate progress based on phase and status (legacy fallback)
function getProgressFromPhase(phase: number, status: string): number {
  if (status === 'completed') return 100
  if (status === 'error') return Math.max(0, (phase - 1) * 25)
  if (status === 'processing') {
    // Phases 1-4, each represents 25% progress
    return Math.min(100, phase * 25)
  }
  return 0
}

// Helper function to get platforms from product data
function getPlatformsFromProduct(product: any): string[] {
  // Default platforms based on product status
  const platforms = ['wordpress']
  
  if (product.status === 'completed') {
    platforms.push('facebook')
  }
  
  return platforms
} 