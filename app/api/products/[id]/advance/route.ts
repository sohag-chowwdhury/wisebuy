import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'
import { logPipelineEventRT, updateProductStatus, startPipelinePhaseRT, completePipelinePhaseRT } from '@/lib/supabase/realtime-database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const body = await request.json()
    const { action, phase } = body

    console.log(`🔄 [ADVANCE] ${action} for product ${productId}, phase ${phase}`)

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

    switch (action) {
      case 'start_phase':
        if (!phase || phase < 1 || phase > 4) {
          return NextResponse.json(
            { error: 'Invalid phase number' },
            { status: 400 }
          )
        }

        const phaseNames = {
          1: 'Product Analysis',
          2: 'Market Research', 
          3: 'SEO Analysis',
          4: 'Listing Generation'
        }

        await startPipelinePhaseRT(productId, phase, phaseNames[phase as keyof typeof phaseNames])
        
        return NextResponse.json({
          success: true,
          message: `Started phase ${phase} for product ${productId}`
        })

      case 'complete_phase':
        if (!phase || phase < 1 || phase > 4) {
          return NextResponse.json(
            { error: 'Invalid phase number' },
            { status: 400 }
          )
        }

        await completePipelinePhaseRT(productId, phase)
        
        return NextResponse.json({
          success: true,
          message: `Completed phase ${phase} for product ${productId}`
        })

      case 'advance_to_next':
        const currentPhase = product.current_phase || 1
        
        if (currentPhase >= 4) {
          // Complete the product
          await updateProductStatus(productId, 'completed', 4, 100)
          
          return NextResponse.json({
            success: true,
            message: `Product ${productId} marked as completed`
          })
        }

        // Complete current phase and start next
        await completePipelinePhaseRT(productId, currentPhase)
        
        return NextResponse.json({
          success: true,
          message: `Advanced product ${productId} from phase ${currentPhase} to ${currentPhase + 1}`
        })

      case 'simulate_processing':
        // Simulate processing by rapidly advancing through phases
        let processPhase = product.current_phase || 1
        
        if (processPhase > 4) {
          return NextResponse.json({
            success: true,
            message: 'Product already completed'
          })
        }

        // Start current phase if not already running
        const { data: currentPhaseData } = await supabase
          .from('pipeline_phases')
          .select('*')
          .eq('product_id', productId)
          .eq('phase_number', processPhase)
          .single()

        if (!currentPhaseData || currentPhaseData.status !== 'running') {
          const phaseNames = {
            1: 'Product Analysis',
            2: 'Market Research', 
            3: 'SEO Analysis',
            4: 'Listing Generation'
          }
          await startPipelinePhaseRT(productId, processPhase, phaseNames[processPhase as keyof typeof phaseNames])
        }

        return NextResponse.json({
          success: true,
          message: `Started processing simulation for product ${productId} at phase ${processPhase}`
        })

      case 'reset':
        // Reset product to phase 1
        await updateProductStatus(productId, 'processing', 1, 0)
        
        // Reset all phases
        await supabase
          .from('pipeline_phases')
          .delete()
          .eq('product_id', productId)

        await logPipelineEventRT(productId, 1, 'info', 'Product reset to phase 1', 'reset_product')
        
        return NextResponse.json({
          success: true,
          message: `Reset product ${productId} to phase 1`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start_phase, complete_phase, advance_to_next, simulate_processing, or reset' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ [ADVANCE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to advance product' },
      { status: 500 }
    )
  }
} 