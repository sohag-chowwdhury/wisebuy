// app/api/add-test-images/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    const supabase = createServerClient()
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    
    // Get products without images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        product_images(id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const productsWithoutImages = products?.filter(p => !p.product_images || p.product_images.length === 0) || []
    
    if (productsWithoutImages.length === 0) {
      return NextResponse.json({ 
        message: 'All products already have images',
        total_products: products?.length || 0
      })
    }

    // Test images from Unsplash (free to use)
    const testImages = [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', // coffee maker
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop', // vacuum
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', // electronics
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', // gadgets
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', // general product
    ]

    const results = []

    // Add test images to products
    for (let i = 0; i < Math.min(productsWithoutImages.length, testImages.length); i++) {
      const product = productsWithoutImages[i]
      const imageUrl = testImages[i % testImages.length]
      
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          image_url: imageUrl,
          storage_path: `test-images/${product.id}-test.jpg`,
          is_primary: true,
          file_name: `${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          file_size: 150000,
          mime_type: 'image/jpeg'
        })

      if (insertError) {
        console.error(`Failed to add image to product ${product.id}:`, insertError)
        results.push({
          product_id: product.id,
          product_name: product.name,
          success: false,
          error: insertError.message
        })
      } else {
        results.push({
          product_id: product.id,
          product_name: product.name,
          success: true,
          image_url: imageUrl
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    return NextResponse.json({
      message: `Added test images to ${successCount} products`,
      total_processed: results.length,
      results
    })

  } catch (error) {
    console.error('Add test images error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add test images' },
      { status: 500 }
    )
  }
} 