import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { logPipelineEventRT, updateProductStatus, startPipelinePhaseRT, completePipelinePhaseRT } from '@/lib/supabase/realtime-database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    console.log(`🎭 [SIMULATE] Starting progressive simulation for product ${productId}`)

    // Get current product status
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const currentPhase = product.current_phase || 1

    if (currentPhase >= 4 && product.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Product already completed'
      })
    }

    // Start the simulation without waiting (fire and forget)
    simulateProgressiveProcessing(productId, currentPhase).catch(error => {
      console.error('❌ [SIMULATE] Background simulation error:', error)
    })

    return NextResponse.json({
      success: true,
      message: `Started progressive simulation for product ${productId} from phase ${currentPhase}`
    })

  } catch (error) {
    console.error('❌ [SIMULATE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start simulation' },
      { status: 500 }
    )
  }
}

async function simulateProgressiveProcessing(productId: string, startPhase: number) {
  const phaseNames = {
    1: 'Product Analysis',
    2: 'Market Research', 
    3: 'SEO Analysis',
    4: 'Listing Generation'
  }

  try {
    for (let phase = startPhase; phase <= 4; phase++) {
      console.log(`🔄 [SIMULATE] Processing phase ${phase} for ${productId}`)

      // Start the phase
      await startPipelinePhaseRT(productId, phase, phaseNames[phase as keyof typeof phaseNames])
      
      // Simulate processing time with progress updates
      const processingTime = Math.random() * 5000 + 2000 // 2-7 seconds
      const progressSteps = 5
      const stepTime = processingTime / progressSteps

      for (let step = 1; step <= progressSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, stepTime))
        
        const progress = Math.floor((step / progressSteps) * 100)
        
        // Update phase progress
        await supabase
          .from('pipeline_phases')
          .update({
            progress_percentage: progress,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('phase_number', phase)

        console.log(`📊 [SIMULATE] Phase ${phase} progress: ${progress}%`)
      }

      // Complete the phase
      await completePipelinePhaseRT(productId, phase)
      
      // Small delay between phases
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`🎉 [SIMULATE] Completed all phases for product ${productId}`)

  } catch (error) {
    console.error(`❌ [SIMULATE] Error in progressive simulation:`, error)
    
    // Mark as error if simulation fails
    await updateProductStatus(productId, 'error', undefined, undefined)
    await logPipelineEventRT(productId, startPhase, 'error', 'Simulation failed', 'simulation_error')
  }
} 