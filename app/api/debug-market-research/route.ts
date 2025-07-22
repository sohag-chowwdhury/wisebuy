// app/api/debug-market-research/route.ts - Debug Market Research Issues
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1' // Demo user
  
  const debug: {
    step1_tableExists: boolean;
    step2_columnsExist: string[];
    step3_sampleProducts: any[];
    step4_existingResearchData: any[];
    step5_apiKeysPresent: {
      anthropic: boolean;
      gemini: boolean;
    };
    errors: string[];
  } = {
    step1_tableExists: false,
    step2_columnsExist: [],
    step3_sampleProducts: [],
    step4_existingResearchData: [],
    step5_apiKeysPresent: {
      anthropic: false,
      gemini: false
    },
    errors: []
  }

  try {
    console.log('🔍 [DEBUG] Starting market research debugging...')

    // Step 1: Check if market_research_data table exists
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('market_research_data')
        .select('count')
        .limit(1)
      
      if (!tableError) {
        debug.step1_tableExists = true
        console.log('✅ [DEBUG] market_research_data table exists')
      } else {
        debug.errors.push(`Table check failed: ${tableError.message}`)
      }
    } catch (error) {
      debug.errors.push(`Table check error: ${error}`)
    }

    // Step 2: Check if new columns exist by trying to select them
    if (debug.step1_tableExists) {
      const columnsToCheck = [
        'ebay_price', 'ebay_link', 'ebay_seller_rating', 
        'average_market_price', 'price_range_min', 'price_range_max',
        'market_demand', 'ai_confidence', 'search_keywords', 'marketplace_urls'
      ]

      for (const column of columnsToCheck) {
        try {
          const { error } = await supabase
            .from('market_research_data')
            .select(column)
            .limit(1)
          
          if (!error) {
            debug.step2_columnsExist.push(column)
          } else {
            debug.errors.push(`Column ${column} missing: ${error.message}`)
          }
        } catch (error) {
          debug.errors.push(`Column check error for ${column}: ${error}`)
        }
      }
    }

    // Step 3: Get sample products to test with
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, model, brand, category, status')
        .eq('user_id', userId)
        .limit(3)

      if (!productsError && products) {
        debug.step3_sampleProducts = products.map(p => ({
          id: p.id,
          name: p.name,
          model: p.model,
          brand: p.brand,
          category: p.category,
          status: p.status
        }))
        console.log(`✅ [DEBUG] Found ${products.length} sample products`)
      } else {
        debug.errors.push(`Products fetch failed: ${productsError?.message}`)
      }
    } catch (error) {
      debug.errors.push(`Products check error: ${error}`)
    }

    // Step 4: Check existing market research data
    if (debug.step1_tableExists) {
      try {
        const { data: existingData, error: dataError } = await supabase
          .from('market_research_data')
          .select('id, product_id, amazon_price, ebay_price, created_at')
          .limit(5)

        if (!dataError) {
          debug.step4_existingResearchData = existingData || []
          console.log(`📊 [DEBUG] Found ${debug.step4_existingResearchData.length} existing research records`)
        } else {
          debug.errors.push(`Research data fetch failed: ${dataError.message}`)
        }
      } catch (error) {
        debug.errors.push(`Research data check error: ${error}`)
      }
    }

    // Step 5: Check API keys
    debug.step5_apiKeysPresent = {
      anthropic: !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
      gemini: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
    }

    // Summary and recommendations
    const recommendations = []
    
    if (!debug.step1_tableExists) {
      recommendations.push('❌ Run the database schema creation first')
    }
    
    if (debug.step2_columnsExist.length < 8) {
      recommendations.push('❌ Run the column addition SQL script: sql/market_research_columns_to_add.sql')
    }
    
    if (!debug.step5_apiKeysPresent.anthropic) {
      recommendations.push('❌ Add ANTHROPIC_API_KEY to your .env.local')
    }
    
    if (!debug.step5_apiKeysPresent.gemini) {
      recommendations.push('❌ Add GEMINI_API_KEY to your .env.local')
    }
    
    if (debug.step3_sampleProducts.length === 0) {
      recommendations.push('❌ Upload some products first to test market research')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Everything looks good! Try the test endpoint: /api/test-market-research')
    }

    return NextResponse.json({
      success: true,
      debug,
      recommendations,
      summary: {
        tableExists: debug.step1_tableExists,
        columnsAdded: `${debug.step2_columnsExist.length}/10`,
        sampleProducts: debug.step3_sampleProducts.length,
        existingResearchRecords: debug.step4_existingResearchData.length,
        apiKeysConfigured: debug.step5_apiKeysPresent.anthropic && debug.step5_apiKeysPresent.gemini,
        readyToTest: debug.step1_tableExists && debug.step2_columnsExist.length >= 8 && debug.step5_apiKeysPresent.anthropic && debug.step5_apiKeysPresent.gemini
      },
      nextSteps: recommendations.length > 0 ? recommendations : [
        '1. Test with: GET /api/test-market-research',
        '2. Try research on a product: POST /api/dashboard/products/{product_id}/research',
        '3. Check logs for any errors'
      ]
    })

  } catch (error) {
    console.error('❌ [DEBUG] Debug check failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug check failed',
      debug,
      message: 'Failed to complete debug check'
    }, { status: 500 })
  }
}

// POST endpoint to test inserting data manually
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    console.log('🧪 [DEBUG] Testing manual data insertion...')

    // Test inserting a sample record
    const testData = {
      product_id: '00000000-0000-0000-0000-000000000000', // Fake product ID for testing
      amazon_price: 299.99,
      amazon_link: 'https://amazon.com/dp/TEST123',
      ebay_price: 275.50,
      ebay_link: 'https://ebay.com/itm/TEST456',
      ebay_condition: 'used',
      ebay_seller_rating: 4.8,
      average_market_price: 287.75,
      price_range_min: 275.50,
      price_range_max: 299.99,
      market_demand: 'medium',
      ai_confidence: 0.85,
      competitor_count: 2,
      search_keywords: ['test product', 'sample item'],
      marketplace_urls: {
        amazon: [{ title: 'Test Amazon Product', url: 'https://amazon.com/dp/TEST123', price: 299.99 }],
        ebay: [{ title: 'Test eBay Product', url: 'https://ebay.com/itm/TEST456', price: 275.50 }]
      },
      research_sources: ['claude-ai', 'gemini-ai'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('market_research_data')
      .insert(testData)
      .select()

    if (error) {
      throw new Error(`Insert failed: ${error.message}`)
    }

    console.log('✅ [DEBUG] Test data inserted successfully')

    // Clean up - delete the test record
    await supabase
      .from('market_research_data')
      .delete()
      .eq('product_id', testData.product_id)

    return NextResponse.json({
      success: true,
      message: 'Test data insertion successful! The database is working.',
      testData,
      insertResult: data
    })

  } catch (error) {
    console.error('❌ [DEBUG] Test insertion failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test insertion failed',
      message: 'Database insert test failed. Check your schema.'
    }, { status: 500 })
  }
} 