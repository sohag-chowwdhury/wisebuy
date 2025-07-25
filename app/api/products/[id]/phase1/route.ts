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

    console.log(`🔧 [PHASE1-UPDATE] Updating Phase 1 data for product: ${productId}`, data);

    // Validate required fields
    if (!data.productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Start a transaction-like operation
    const updates = [];

    // 1. Update main products table
    const productUpdate = {
      name: data.productName,
      model: data.model || null,
      ai_confidence: data.confidence || null,
      updated_at: new Date().toISOString()
    };

    const { error: productError } = await supabaseAdmin
      .from('products')
      .update(productUpdate)
      .eq('id', productId);

    if (productError) {
      console.error('❌ [PHASE1-UPDATE] Error updating products table:', productError);
      throw new Error(`Failed to update product: ${productError.message}`);
    }

    updates.push('products table');

    // 2. Upsert product_analysis_data table
    const analysisData = {
      product_id: productId,
      product_name: data.productName,
      model: data.model || null,
      confidence: data.confidence || null,
      item_condition: data.itemCondition || 'good',
      condition_details: data.conditionDetails || null,
      updated_at: new Date().toISOString()
    };

    const { error: analysisError } = await supabaseAdmin
      .from('product_analysis_data')
      .upsert(analysisData, { onConflict: 'product_id' });

    if (analysisError) {
      console.error('❌ [PHASE1-UPDATE] Error updating product_analysis_data table:', analysisError);
      throw new Error(`Failed to update analysis data: ${analysisError.message}`);
    }

    updates.push('product_analysis_data table');

    console.log(`✅ [PHASE1-UPDATE] Successfully updated: ${updates.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Phase 1 data updated successfully`,
      updated: updates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [PHASE1-UPDATE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update Phase 1 data',
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

    console.log(`🔍 [PHASE1-GET] Fetching Phase 1 data for product: ${productId}`);

    // Fetch data from both tables
    const [productResult, analysisResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, name, model, ai_confidence, created_at, updated_at')
        .eq('id', productId)
        .single(),
      
      supabaseAdmin
        .from('product_analysis_data')
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
    const analysis = analysisResult.error ? null : analysisResult.data;

    // Combine data for Phase 1 form
    const phase1Data = {
      productName: product.name || '',
      model: product.model || '',
      confidence: product.ai_confidence || analysis?.confidence || 85,
      itemCondition: analysis?.item_condition || 'good',
      conditionDetails: analysis?.condition_details || 'Product analyzed and in good condition',
      lastUpdated: product.updated_at
    };

    return NextResponse.json({
      success: true,
      data: phase1Data
    });

  } catch (error) {
    console.error('❌ [PHASE1-GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Phase 1 data' },
      { status: 500 }
    );
  }
} 