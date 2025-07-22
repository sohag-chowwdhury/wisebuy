import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { completePipelinePhaseRT, updateProductStatus } from '@/lib/supabase/realtime-database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [FORCE-REFRESH] Starting manual refresh and fix...')

    // Get all products with analysis data but stuck in phase 1
    const { data: stuckProducts, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        status,
        current_phase,
        ai_confidence,
        product_analysis_data(*)
      `)
      .eq('current_phase', 1)
      .gte('ai_confidence', 80)

    if (error) {
      throw error
    }

    console.log(`🔧 [FORCE-REFRESH] Found ${stuckProducts?.length || 0} stuck products`)

    let fixedCount = 0

    for (const product of stuckProducts || []) {
      if (product.product_analysis_data && product.product_analysis_data.length > 0) {
        console.log(`🔄 [FORCE-REFRESH] Fixing product ${product.id} (${product.name})`)
        
        // Complete Phase 1
        await completePipelinePhaseRT(product.id, 1)
        fixedCount++
        
        console.log(`✅ [FORCE-REFRESH] Fixed ${product.name}`)
      }
    }

    // Also trigger a manual database update to refresh real-time
    if (stuckProducts && stuckProducts.length > 0) {
      const testProduct = stuckProducts[0]
      await supabase
        .from('products')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', testProduct.id)
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed dashboard and fixed ${fixedCount} stuck products`,
      fixedProducts: fixedCount,
      totalChecked: stuckProducts?.length || 0
    })

  } catch (error) {
    console.error('❌ [FORCE-REFRESH] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    )
  }
} 