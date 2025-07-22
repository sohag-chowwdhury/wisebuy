// app/api/products/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { name, model, images } = body

    // Create product record
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: 'user-id-here', // TODO: Get from auth
        name,
        model,
        status: 'uploaded'
      })
      .select()
      .single()

    if (productError) {
      throw new Error(`Failed to create product: ${productError.message}`)
    }

    // Upload images if provided
    if (images && images.length > 0) {
      const imageInserts = images.map((image: any, index: number) => ({
        product_id: product.id,
        image_url: image.url,
        storage_path: image.path,
        file_name: image.name,
        file_size: image.size,
        mime_type: image.type,
        is_primary: index === 0
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Failed to insert images:', imagesError)
      }
    }

    // Start Phase 1 processing
    const { data: phaseId, error: phaseError } = await supabase
      .rpc('start_phase', {
        p_product_id: product.id,
        p_phase_number: 1
      })

    if (phaseError) {
      console.error('Failed to start phase 1:', phaseError)
    }

    return NextResponse.json({
      success: true,
      product: product,
      message: 'Product uploaded successfully and processing started'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
