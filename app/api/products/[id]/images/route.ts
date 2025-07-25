import { createClient } from '@/lib/supabase/server'
import { supabase as supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface UploadResponse {
  success: boolean
  images?: string[]
  error?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UploadResponse>> {
  const resolvedParams = await params
  console.log('🚀 [PRODUCT-IMAGES] Handler reached! Product ID:', resolvedParams.id)
  console.log('🚀 [PRODUCT-IMAGES] Request method:', request.method)
  console.log('🚀 [PRODUCT-IMAGES] Request URL:', request.url)
  console.log('🚀 [PRODUCT-IMAGES] Params object:', JSON.stringify(resolvedParams))
  
  try {
    console.log('📤 [PRODUCT-IMAGES] Starting image upload for product:', resolvedParams.id)

    // Use admin client for database operations (like other working APIs)
    console.log('🔗 [PRODUCT-IMAGES] Using Supabase admin client')

    // Use the correct user ID where products are stored
    let userId: string = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1' // Your actual user ID

    console.log('🔍 [PRODUCT-IMAGES] Looking for product:', resolvedParams.id, 'with user_id:', userId)

    // First, let's check if the product exists at all (without user_id filter)
    const { data: anyProduct, error: anyProductError } = await supabaseAdmin
      .from('products')
      .select('id, user_id, name')
      .eq('id', resolvedParams.id)
      .single()

    console.log('🔍 [PRODUCT-IMAGES] Product exists check:', { anyProduct, anyProductError })

    // Let's also see all products to understand the data structure
    const { data: allProducts, error: allProductsError } = await supabaseAdmin
      .from('products')
      .select('id, user_id, name')
      .limit(5)

    console.log('🔍 [PRODUCT-IMAGES] Sample products in database:', { allProducts, allProductsError })

    // Now check with user_id filter
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single()

    console.log('🔍 [PRODUCT-IMAGES] Product query result:', { product, productError })

    if (productError || !product) {
      console.error('❌ [PRODUCT-IMAGES] Product not found. Error:', productError)
      console.error('❌ [PRODUCT-IMAGES] Query details - Product ID:', resolvedParams.id, 'User ID:', userId)
      return NextResponse.json(
        { success: false, error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    console.log('✅ [PRODUCT-IMAGES] Product found! Proceeding with image upload')

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      )
    }

    console.log('📤 [PRODUCT-IMAGES] Processing', files.length, 'images')

    const uploadedImageUrls: string[] = []
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    // Validate and upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { success: false, error: `File too large: ${file.name}. Maximum 10MB allowed.` },
          { status: 400 }
        )
      }

      try {
                 // Generate unique filename
         const timestamp = Date.now()
         const randomString = Math.random().toString(36).substring(2, 15)
         const fileExtension = file.name.split('.').pop() || 'jpg'
         const fileName = `product-${resolvedParams.id}-${timestamp}-${randomString}.${fileExtension}`
         
         console.log('📤 [PRODUCT-IMAGES] Uploading file:', file.name, '→', fileName)

        // Convert File to ArrayBuffer for Supabase upload
        const fileBuffer = await file.arrayBuffer()

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('❌ [PRODUCT-IMAGES] Upload error:', uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(fileName)

        uploadedImageUrls.push(publicUrl)
        console.log('✅ [PRODUCT-IMAGES] Uploaded:', fileName, '→', publicUrl)

      } catch (error) {
        console.error('❌ [PRODUCT-IMAGES] Error uploading file:', file.name, error)
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    // Insert new images into product_images table
    const imageRecords = uploadedImageUrls.map((imageUrl, index) => {
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = files[index].name.split('.').pop() || 'jpg'
      const storagePath = `product-${resolvedParams.id}-${timestamp}-${randomString}.${fileExtension}`
      
      return {
        product_id: resolvedParams.id,
        image_url: imageUrl,
        storage_path: storagePath,
        is_primary: false,
        file_name: files[index].name,
        file_size: files[index].size,
        mime_type: files[index].type
      }
    })

    const { error: insertError } = await supabaseAdmin
      .from('product_images')
      .insert(imageRecords)

    if (insertError) {
      console.error('❌ [PRODUCT-IMAGES] Failed to save image records:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save image records to database' },
        { status: 500 }
      )
    }

    console.log('✅ [PRODUCT-IMAGES] Successfully added', uploadedImageUrls.length, 'images to product')

    return NextResponse.json({
      success: true,
      images: uploadedImageUrls
    })

  } catch (error) {
    console.error('❌ [PRODUCT-IMAGES] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 