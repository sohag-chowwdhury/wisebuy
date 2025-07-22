// app/api/test-research-for-product/route.ts - Test Market Research for Specific Product
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const productId = '81d1a24b-5c22-4667-91b9-1e6028e90836' // The completed product
    
    console.log(`🧪 [TEST] Testing market research for completed product: ${productId}`)
    
    // Call the research API directly
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const researchResponse = await fetch(`${baseUrl}/api/dashboard/products/${productId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!researchResponse.ok) {
      const errorText = await researchResponse.text()
      throw new Error(`Research API failed: ${researchResponse.status} - ${errorText}`)
    }
    
    const researchResult = await researchResponse.json()
    
    console.log(`✅ [TEST] Market research completed for product ${productId}:`, researchResult.message)
    
    return NextResponse.json({
      success: true,
      productId,
      researchResult,
      message: `Successfully triggered market research for completed product ${productId}`,
      instructions: [
        '1. Check your market_research_data table in Supabase',
        '2. Look for records with product_id = ' + productId,
        '3. Verify Amazon/eBay data is populated',
        '4. Check the AI confidence scores and market analysis'
      ]
    })
    
  } catch (error) {
    console.error('❌ [TEST] Research test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      troubleshooting: [
        '1. Make sure you have ANTHROPIC_API_KEY in .env.local',
        '2. Make sure you have GEMINI_API_KEY in .env.local',
        '3. Run: sql/market_research_columns_to_add.sql in Supabase',
        '4. Check that product 81d1a24b-5c22-4667-91b9-1e6028e90836 exists',
        '5. Check server console logs for detailed errors'
      ]
    }, { status: 500 })
  }
}

// POST endpoint to test with any product ID
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
        message: 'Please provide a productId in the request body'
      }, { status: 400 })
    }
    
    console.log(`🧪 [TEST] Testing market research for product: ${productId}`)
    
    // Call the research API directly
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const researchResponse = await fetch(`${baseUrl}/api/dashboard/products/${productId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!researchResponse.ok) {
      const errorText = await researchResponse.text()
      throw new Error(`Research API failed: ${researchResponse.status} - ${errorText}`)
    }
    
    const researchResult = await researchResponse.json()
    
    return NextResponse.json({
      success: true,
      productId,
      researchResult,
      message: `Market research completed for product ${productId}`,
      nextSteps: [
        'Check your market_research_data table in Supabase',
        'Verify the data was inserted correctly',
        'Test the dashboard "🔍 Research" buttons'
      ]
    })
    
  } catch (error) {
    console.error('❌ [TEST] Research test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
} 