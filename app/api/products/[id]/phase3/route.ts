import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const data = await request.json();

    console.log(`🔧 [PHASE3-UPDATE] Updating Phase 3 data for product: ${productId}`, data);

    const updates = [];

    // 1. Update relevant SEO fields in products table
    const productUpdate = {
      seo_title: data.seoTitle || null,
      meta_description: data.metaDescription || null,
      url_slug: data.urlSlug || null,
      keywords: data.keywords || null,
      updated_at: new Date().toISOString()
    };

    const { error: productError } = await supabaseAdmin
      .from('products')
      .update(productUpdate)
      .eq('id', productId);

    if (productError) {
      console.error('❌ [PHASE3-UPDATE] Error updating products table:', productError);
      throw new Error(`Failed to update product: ${productError.message}`);
    }

    updates.push('products table');

    // 2. Upsert seo_analysis_data table
    const seoData = {
      product_id: productId,
      seo_title: data.seoTitle || null,
      url_slug: data.urlSlug || null,
      meta_description: data.metaDescription || null,
      keywords: data.keywords || null,
      tags: data.tags || null,
      updated_at: new Date().toISOString()
    };

    const { error: seoError } = await supabaseAdmin
      .from('seo_analysis_data')
      .upsert(seoData, { onConflict: 'product_id' });

    if (seoError) {
      console.error('❌ [PHASE3-UPDATE] Error updating seo_analysis_data table:', seoError);
      throw new Error(`Failed to update SEO analysis data: ${seoError.message}`);
    }

    updates.push('seo_analysis_data table');

    console.log(`✅ [PHASE3-UPDATE] Successfully updated: ${updates.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Phase 3 data updated successfully`,
      updated: updates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PHASE3-UPDATE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update Phase 3 data',
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

    console.log(`🔍 [PHASE3-GET] Fetching Phase 3 data for product: ${productId}`);

    // Fetch data from both tables
    const [productResult, seoResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, seo_title, meta_description, url_slug, keywords, created_at, updated_at')
        .eq('id', productId)
        .single(),
      
      supabaseAdmin
        .from('seo_analysis_data')
        .select('*')
        .eq('product_id', productId)
        .single()
    ]);

    if (productResult.error) {
      return NextResponse.json(
        { error: `Product not found: ${productResult.error.message}` },
        { status: 404 }
      );
    }

    const product = productResult.data;
    const seo = seoResult.error ? null : seoResult.data;

    // Combine data for Phase 3 form
    const phase3Data = {
      seoTitle: product.seo_title || seo?.seo_title || '',
      urlSlug: product.url_slug || seo?.url_slug || '',
      metaDescription: product.meta_description || seo?.meta_description || '',
      keywords: product.keywords || seo?.keywords || [],
      tags: seo?.tags || [],
      lastUpdated: product.updated_at
    };

    return NextResponse.json({
      success: true,
      data: phase3Data
    });

  } catch (error) {
    console.error('❌ [PHASE3-GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Phase 3 data' },
      { status: 500 }
    );
  }
} 