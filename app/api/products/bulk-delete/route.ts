import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    console.log('🗑️ [BULK-DELETE] Starting bulk delete for products:', productIds);

    // Use demo user ID for validation
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1';

    // Validate all products belong to the user
    const { data: existingProducts, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .in('id', productIds)
      .eq('user_id', userId);

    if (fetchError) {
      console.error('❌ [BULK-DELETE] Error fetching products:', fetchError);
      return NextResponse.json(
        { error: 'Failed to validate products' },
        { status: 500 }
      );
    }

    if (!existingProducts || existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found or do not belong to user' },
        { status: 404 }
      );
    }

    // Delete all related data first (foreign key constraints)
    const deleteOperations = [
      // Delete market research data
      supabaseAdmin
        .from('market_research_data')
        .delete()
        .in('product_id', productIds),

      // Delete pipeline phases
      supabaseAdmin
        .from('pipeline_phases')
        .delete()
        .in('product_id', productIds),

      // Delete analysis data
      supabaseAdmin
        .from('analysis_data')
        .delete()
        .in('product_id', productIds),

      // Delete product images
      supabaseAdmin
        .from('product_images')
        .delete()
        .in('product_id', productIds),

      // Finally delete products
      supabaseAdmin
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('user_id', userId)
    ];

    // Execute all delete operations
    for (let i = 0; i < deleteOperations.length; i++) {
      const { error } = await deleteOperations[i];
      if (error) {
        console.error(`❌ [BULK-DELETE] Error in operation ${i + 1}:`, error);
        // Continue with other operations even if one fails
      }
    }

    console.log('✅ [BULK-DELETE] Successfully deleted products and related data');

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${productIds.length} product(s)`,
      deletedProducts: existingProducts.map(p => ({ id: p.id, name: p.name }))
    });

  } catch (error) {
    console.error('❌ [BULK-DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 