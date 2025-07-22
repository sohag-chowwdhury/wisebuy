import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { completePipelinePhaseRT, updateProductStatus, logPipelineEventRT } from '@/lib/supabase/realtime-database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    console.log(`🔧 [COMPLETE-STUCK] Checking for stuck phases in product ${productId}`)

    // Get product and its phases
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        pipeline_phases(*),
        product_analysis_data(*)
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log(`📊 [COMPLETE-STUCK] Product status: ${product.status}, current_phase: ${product.current_phase}, ai_confidence: ${product.ai_confidence}`)

    const phases = product.pipeline_phases || []
    const analysisData = product.product_analysis_data?.[0]
    
    let completedPhases = 0

    // Check Phase 1 - Product Analysis
    const phase1 = phases.find((p: any) => p.phase_number === 1)
    if (product.ai_confidence && product.ai_confidence >= 80 && analysisData) {
      console.log(`✅ [COMPLETE-STUCK] Phase 1 data exists, AI confidence: ${product.ai_confidence}%`)
      
      if (!phase1 || phase1.status !== 'completed') {
        console.log(`🔄 [COMPLETE-STUCK] Completing stuck Phase 1`)
        await completePipelinePhaseRT(productId, 1, analysisData)
        completedPhases++
      } else {
        console.log(`✅ [COMPLETE-STUCK] Phase 1 already completed`)
        completedPhases++
      }
    }

    // Check Phase 2 - Market Research (if phase 1 is complete)
    if (completedPhases >= 1) {
      const { data: marketData } = await supabase
        .from('product_market_data')
        .select('*')
        .eq('product_id', productId)
        .single()

      const phase2 = phases.find((p: any) => p.phase_number === 2)
      
      if (marketData && (!phase2 || phase2.status !== 'completed')) {
        console.log(`🔄 [COMPLETE-STUCK] Completing stuck Phase 2`)
        await completePipelinePhaseRT(productId, 2, marketData)
        completedPhases++
      } else if (marketData && phase2?.status === 'completed') {
        console.log(`✅ [COMPLETE-STUCK] Phase 2 already completed`)
        completedPhases++
      }
    }

    // Check Phase 3 - SEO Analysis (if phase 2 is complete)
    if (completedPhases >= 2) {
      const { data: seoData } = await supabase
        .from('seo_analysis_data')
        .select('*')
        .eq('product_id', productId)
        .single()

      const phase3 = phases.find((p: any) => p.phase_number === 3)
      
      if (seoData && (!phase3 || phase3.status !== 'completed')) {
        console.log(`🔄 [COMPLETE-STUCK] Completing stuck Phase 3`)
        await completePipelinePhaseRT(productId, 3, seoData)
        completedPhases++
      } else if (seoData && phase3?.status === 'completed') {
        console.log(`✅ [COMPLETE-STUCK] Phase 3 already completed`)
        completedPhases++
      }
    }

    // Check Phase 4 - Listing Generation (if phase 3 is complete)
    if (completedPhases >= 3) {
      const { data: listingData } = await supabase
        .from('product_listings')
        .select('*')
        .eq('product_id', productId)

      const phase4 = phases.find((p: any) => p.phase_number === 4)
      
      if (listingData && listingData.length > 0 && (!phase4 || phase4.status !== 'completed')) {
        console.log(`🔄 [COMPLETE-STUCK] Completing stuck Phase 4`)
        await completePipelinePhaseRT(productId, 4, { listings: listingData.length })
        completedPhases++
      } else if (listingData && listingData.length > 0 && phase4?.status === 'completed') {
        console.log(`✅ [COMPLETE-STUCK] Phase 4 already completed`)
        completedPhases++
      }
    }

    // Final product status check
    if (completedPhases >= 4 && product.status !== 'completed') {
      console.log(`🎉 [COMPLETE-STUCK] All phases complete - marking product as completed`)
      await updateProductStatus(productId, 'completed', 4, 100)
    }

    await logPipelineEventRT(productId, completedPhases, 'info', `Completed ${completedPhases} stuck phases`, 'fix_stuck_phases')

    return NextResponse.json({
      success: true,
      message: `Fixed ${completedPhases} stuck phases for product ${productId}`,
      completedPhases,
      productStatus: completedPhases >= 4 ? 'completed' : 'processing'
    })

  } catch (error) {
    console.error('❌ [COMPLETE-STUCK] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete stuck phases' },
      { status: 500 }
    )
  }
} 