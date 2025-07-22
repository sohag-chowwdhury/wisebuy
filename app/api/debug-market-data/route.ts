import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Checking market research data...')

    // Get a few sample records to inspect
    const { data: marketRecords, error } = await supabase
      .from('product_market_data')
      .select(`
        *,
        products(name, model, brand, category)
      `)
      .limit(5)

    if (error) {
      throw error
    }

    // Check what columns exist in the table
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'product_market_data')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    // Count records with null values for new fields
    const { data: nullCounts } = await supabase
      .from('product_market_data')
      .select('*')

    let brandNulls = 0, yearNulls = 0, weightNulls = 0, dimensionsNulls = 0
    
    if (nullCounts) {
      brandNulls = nullCounts.filter((r: any) => !r.brand).length
      yearNulls = nullCounts.filter((r: any) => !r.year).length
      weightNulls = nullCounts.filter((r: any) => !r.weight).length
      dimensionsNulls = nullCounts.filter((r: any) => !r.dimensions).length
    }

    const debugInfo = {
      tableSchema: {
        totalColumns: columns?.length || 0,
        hasNewFields: {
          brand: columns?.some((c: any) => c.column_name === 'brand') || false,
          year: columns?.some((c: any) => c.column_name === 'year') || false,
          weight: columns?.some((c: any) => c.column_name === 'weight') || false,
          dimensions: columns?.some((c: any) => c.column_name === 'dimensions') || false,
          manufacturer: columns?.some((c: any) => c.column_name === 'manufacturer') || false,
          specifications: columns?.some((c: any) => c.column_name === 'specifications') || false,
        }
      },
      dataAnalysis: {
        totalRecords: nullCounts?.length || 0,
        nullCounts: {
          brand: brandNulls,
          year: yearNulls,
          weight: weightNulls,
          dimensions: dimensionsNulls
        },
        percentageNull: {
          brand: nullCounts?.length ? Math.round((brandNulls / nullCounts.length) * 100) : 0,
          year: nullCounts?.length ? Math.round((yearNulls / nullCounts.length) * 100) : 0,
          weight: nullCounts?.length ? Math.round((weightNulls / nullCounts.length) * 100) : 0,
          dimensions: nullCounts?.length ? Math.round((dimensionsNulls / nullCounts.length) * 100) : 0,
        }
      },
      sampleRecords: marketRecords?.map((record: any) => ({
        id: record.id,
        productName: record.products?.name,
        productBrand: record.products?.brand,
        marketDataBrand: record.brand,
        year: record.year,
        weight: record.weight,
        dimensions: record.dimensions,
        hasSpecifications: !!record.specifications,
        specificationKeys: record.specifications ? Object.keys(record.specifications) : []
      })) || [],
      columnsInTable: columns?.map((c: any) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable
      })) || []
    }

    console.log('📊 [DEBUG] Market data analysis:', debugInfo)

    return NextResponse.json({
      success: true,
      message: 'Market research data analysis complete',
      debug: debugInfo,
      recommendations: [
        brandNulls > 0 ? `${brandNulls} records missing brand data` : 'All records have brand data',
        yearNulls > 0 ? `${yearNulls} records missing year data` : 'All records have year data',
        weightNulls > 0 ? `${weightNulls} records missing weight data` : 'All records have weight data',
        dimensionsNulls > 0 ? `${dimensionsNulls} records missing dimensions data` : 'All records have dimensions data',
      ]
    })

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Debug failed',
        message: 'Could not analyze market research data'
      },
      { status: 500 }
    )
  }
} 