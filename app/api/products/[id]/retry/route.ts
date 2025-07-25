// app/api/products/[id]/retry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createServerClient()
    const productId = resolvedParams.id

    // Get current product status
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Reset product status and retry from error phase or current phase
    const retryPhase = product.error_phase || product.current_phase
    
    await supabase
      .from('products')
      .update({
        status: 'processing',
        error_message: null,
        error_phase: null,
        retry_count: product.retry_count + 1
      })
      .eq('id', productId)

    // Start the retry phase
    const { data: _phaseId, error: phaseError } = await supabase
      .rpc('start_phase', {
        p_product_id: productId,
        p_phase_number: retryPhase
      })

    if (phaseError) {
      throw new Error(`Failed to start retry: ${phaseError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Retry started for phase ${retryPhase}`
    })

  } catch (error) {
    console.error('Retry error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    )
  }
}