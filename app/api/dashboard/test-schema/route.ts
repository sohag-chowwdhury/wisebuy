// app/api/dashboard/test-schema/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(_request: NextRequest) {
  const supabase = createServerClient()
  const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1' // Demo user
  
  const results: any = {
    timestamp: new Date().toISOString(),
    tables: {}
  }

  console.log('🔧 [SCHEMA_TEST] Testing database schema...')

  // Test 1: Basic products table
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
    
    if (error) throw error
    
    results.tables.products = {
      exists: true,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: null
    }
  } catch (error) {
    results.tables.products = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 2: Product images
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(1)
    
    results.tables.product_images = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.product_images = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 3: Product analysis data
  try {
    const { data, error } = await supabase
      .from('product_analysis_data')
      .select('*')
      .limit(1)
    
    results.tables.product_analysis_data = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.product_analysis_data = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 4: Product market data
  try {
    const { data, error } = await supabase
      .from('product_market_data')
      .select('*')
      .limit(1)
    
    results.tables.product_market_data = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.product_market_data = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 5: SEO analysis data
  try {
    const { data, error } = await supabase
      .from('seo_analysis_data')
      .select('*')
      .limit(1)
    
    results.tables.seo_analysis_data = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.seo_analysis_data = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 6: Product listings
  try {
    const { data, error } = await supabase
      .from('product_listings')
      .select('*')
      .limit(1)
    
    results.tables.product_listings = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.product_listings = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 7: Pipeline phases
  try {
    const { data, error } = await supabase
      .from('pipeline_phases')
      .select('*')
      .limit(1)
    
    results.tables.pipeline_phases = {
      exists: !error,
      count: data?.length || 0,
      sampleColumns: data?.[0] ? Object.keys(data[0]) : [],
      error: error?.message || null
    }
  } catch (error) {
    results.tables.pipeline_phases = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  console.log('✅ [SCHEMA_TEST] Schema test completed')
  console.log('📊 [SCHEMA_TEST] Results:', JSON.stringify(results, null, 2))

  return NextResponse.json(results)
} 