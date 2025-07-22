// app/api/products/[id]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const productId = params.id

    // Update product status to paused
    const { error } = await supabase
      .from('products')
      .update({ status: 'paused' })
      .eq('id', productId)

    if (error) {
      throw new Error(`Failed to pause product: ${error.message}`)
    }

    // Cancel any pending background jobs for this product
    await supabase
      .from('background_jobs')
      .update({ status: 'cancelled' })
      .eq('product_id', productId)
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      message: 'Product processing paused'
    })

  } catch (error) {
    console.error('Pause error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pause failed' },
      { status: 500 }
    )
  }
}