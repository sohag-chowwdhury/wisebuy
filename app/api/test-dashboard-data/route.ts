import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST] Testing dashboard data...')
    
    const DEFAULT_USER_ID = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'
    
    // Test 1: Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    console.log('✅ [TEST] Connection test:', { connectionTest, connectionError })
    
    // Test 2: Get all products for the default user
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
    
    console.log('📦 [TEST] All products:', { 
      count: allProducts?.length || 0, 
      error: allProductsError,
      products: allProducts?.map(p => ({ id: p.id, name: p.name, status: p.status }))
    })
    
    // Test 3: Get all products regardless of user (for debugging)
    const { data: allUserProducts, error: allUserError } = await supabase
      .from('products')
      .select('id, user_id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Test 4: Try with admin client to bypass RLS
    const { supabase: supabaseAdmin } = await import('@/lib/supabase/admin')
    const { data: adminProducts, error: adminError } = await supabaseAdmin
      .from('products')
      .select('id, user_id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Test 5: Get unique user_ids to see what's actually in the database
    const { data: userIds, error: userIdsError } = await supabaseAdmin
      .from('products')
      .select('user_id')
      .limit(50)
    
    console.log('👥 [TEST] All users products (client):', { 
      count: allUserProducts?.length || 0, 
      error: allUserError,
      products: allUserProducts
    })
    
    console.log('🔐 [TEST] Admin products:', { 
      count: adminProducts?.length || 0, 
      error: adminError,
      products: adminProducts
    })
    
    console.log('👤 [TEST] User IDs found:', { 
      count: userIds?.length || 0, 
      error: userIdsError,
      uniqueUserIds: [...new Set(userIds?.map(p => p.user_id) || [])]
    })
    
    return NextResponse.json({
      success: true,
      tests: {
        connection: { success: !connectionError, error: connectionError?.message },
        userProducts: { 
          count: allProducts?.length || 0, 
          error: allProductsError?.message,
          products: allProducts?.map(p => ({ 
            id: p.id, 
            name: p.name, 
            status: p.status, 
            created_at: p.created_at 
          }))
        },
        allProducts: {
          count: allUserProducts?.length || 0,
          error: allUserError?.message,
          products: allUserProducts
        },
        adminProducts: {
          count: adminProducts?.length || 0,
          error: adminError?.message,
          products: adminProducts
        },
        userIds: {
          count: userIds?.length || 0,
          error: userIdsError?.message,
          uniqueUserIds: [...new Set(userIds?.map(p => p.user_id) || [])]
        }
      },
      config: {
        defaultUserId: DEFAULT_USER_ID,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    })
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 