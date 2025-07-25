import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    // Validate productId
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    console.log(`🔧 [PHASE4-UPDATE] Updating Phase 4 data for product: ${productId}`, data);
    console.log(`🔧 [PHASE4-UPDATE] Data types:`, {
      productTitle: typeof data.productTitle,
      price: typeof data.price,
      keyFeatures: typeof data.keyFeatures,
      keyFeaturesIsArray: Array.isArray(data.keyFeatures),
      channels: typeof data.channels,
      channelsIsObject: typeof data.channels === 'object' && data.channels !== null
    });

    const updates = [];

    // 1. Update relevant fields in products table
    const productUpdate: any = {
      updated_at: new Date().toISOString()
    };

    // Update core product fields if provided
    if (data.productTitle) {
      productUpdate.name = data.productTitle;
    }
    if (data.brand) {
      productUpdate.brand = data.brand;
    }
    if (data.category) {
      productUpdate.category = data.category;
    }
    if (data.productDescription) {
      productUpdate.product_description = data.productDescription;
    }
    if (data.keyFeatures) {
      productUpdate.key_features = data.keyFeatures;
    }
    // Ensure technicalSpecs is always a valid object, never null or undefined
    if (data.technicalSpecs !== undefined) {
      productUpdate.technical_specs = data.technicalSpecs || {};
    }

    const { error: productError } = await supabaseAdmin
      .from('products')
      .update(productUpdate)
      .eq('id', productId);

    if (productError) {
      console.error('❌ [PHASE4-UPDATE] Error updating products table:', productError);
      return NextResponse.json(
        { 
          error: 'Failed to update product',
          details: productError.message 
        },
        { status: 500 }
      );
    }

    updates.push('products table');

    // 2. Upsert product_listing_data table
    const listingData = {
      product_id: productId,
      product_title: data.productTitle || null,
      price: data.price ? Number(data.price) : null,
      publishing_status: data.publishingStatus || 'draft',
      brand: data.brand || null,
      category: data.category || null,
      item_condition: data.itemCondition || null,
      product_description: data.productDescription || null,
      key_features: Array.isArray(data.keyFeatures) ? data.keyFeatures : (data.keyFeatures ? [data.keyFeatures] : []),
      channels: (data.channels && typeof data.channels === 'object') ? data.channels : {},
      updated_at: new Date().toISOString()
    };

    console.log(`🔧 [PHASE4-UPDATE] Final listing data to upsert:`, JSON.stringify(listingData, null, 2));

    const { error: listingError } = await supabaseAdmin
      .from('product_listing_data')
      .upsert(listingData, { onConflict: 'product_id' });

    if (listingError) {
      console.error('❌ [PHASE4-UPDATE] Error updating product_listing_data table:', listingError);
      console.error('❌ [PHASE4-UPDATE] Listing data that failed:', JSON.stringify(listingData, null, 2));
      console.error('❌ [PHASE4-UPDATE] Full error details:', {
        message: listingError.message,
        details: listingError.details,
        hint: listingError.hint,
        code: listingError.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to update product listing data',
          details: listingError.message,
          hint: listingError.hint,
          code: listingError.code
        },
        { status: 500 }
      );
    }

    updates.push('product_listing_data table');

    console.log(`✅ [PHASE4-UPDATE] Successfully updated: ${updates.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Phase 4 data updated successfully`,
      updated: updates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PHASE4-UPDATE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update Phase 4 data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    console.log(`🔍 [PHASE4-GET] Fetching Phase 4 data for product: ${productId}`);

    // Fetch data from multiple tables
    const [productResult, listingResult, imagesResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, name, brand, category, product_description, key_features, technical_specs, created_at, updated_at')
        .eq('id', productId)
        .single(),
      
      supabaseAdmin
        .from('product_listing_data')
        .select('*')
        .eq('product_id', productId)
        .single(),

      supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })
    ]);

    if (productResult.error) {
      return NextResponse.json(
        { error: `Product not found: ${productResult.error.message}` },
        { status: 404 }
      );
    }

    const product = productResult.data;
    const listing = listingResult.error ? null : listingResult.data;
    const images = imagesResult.error ? [] : imagesResult.data;

    // Transform images for the frontend
    const productImages = images.map((img: any) => ({
      id: img.id,
      imageUrl: img.image_url,
      fileName: img.file_name,
      fileSize: img.file_size,
      isPrimary: img.is_primary
    }));

    // Combine data for Phase 4 form
    const phase4Data = {
      images: productImages,
      productTitle: listing?.product_title || product.name || '',
      price: listing?.price || 0,
      publishingStatus: listing?.publishing_status || 'draft',
      brand: listing?.brand || product.brand || 'Unknown',
      category: listing?.category || product.category || 'General',
      itemCondition: listing?.item_condition || 'good',
      productDescription: listing?.product_description || product.product_description || '',
      keyFeatures: listing?.key_features || product.key_features || [],
      technicalSpecs: product.technical_specs || {},
      channels: listing?.channels || {
        wordpress: false,
        facebook: false,
        ebay: false,
        amazon: false,
      },
      lastUpdated: product.updated_at
    };

    return NextResponse.json({
      success: true,
      data: phase4Data
    });

  } catch (error) {
    console.error('❌ [PHASE4-GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Phase 4 data' },
      { status: 500 }
    );
  }
} 