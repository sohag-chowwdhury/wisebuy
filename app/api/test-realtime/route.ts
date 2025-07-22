import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-REALTIME] Testing real-time updates...')

    // Get any product to test with
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, current_phase, status')
      .limit(1)

    if (error || !products || products.length === 0) {
      return NextResponse.json({
        error: 'No products found to test with'
      }, { status: 404 })
    }

    const testProduct = products[0]
    console.log('🧪 [TEST-REALTIME] Using product:', testProduct.id, testProduct.name)

    // Update the product to trigger real-time subscription
    const { error: updateError } = await supabase
      .from('products')
      .update({
        updated_at: new Date().toISOString(),
        progress: Math.floor(Math.random() * 100)
      })
      .eq('id', testProduct.id)

    if (updateError) {
      throw updateError
    }

    console.log('✅ [TEST-REALTIME] Product updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Real-time test update sent',
      productId: testProduct.id,
      productName: testProduct.name,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [TEST-REALTIME] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
} 