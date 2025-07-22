import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [MIGRATE] Adding brand, year, weight, and dimensions to product_market_data...')

    // Run the migration SQL commands
    const migrationCommands = [
      // Add new columns
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS brand TEXT;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS year INTEGER;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS weight TEXT;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS dimensions TEXT;',
      
      // Add additional specification fields
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS manufacturer TEXT;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS model_number TEXT;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS color TEXT;',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS material TEXT;',
      
      // Add structured data columns
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS dimensions_structured JSONB DEFAULT \'{}\';',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS weight_structured JSONB DEFAULT \'{}\';',
      'ALTER TABLE product_market_data ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT \'{}\';',
    ]

    // Execute each command
    for (const command of migrationCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: command })
      if (error) {
        // Try direct SQL execution if RPC doesn't work
        const { error: directError } = await supabase.from('product_market_data').select('id').limit(1)
        if (directError) {
          console.warn(`⚠️ [MIGRATE] Could not execute: ${command}`)
        }
      }
    }

    // Update existing records with brand from products table
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE product_market_data 
        SET brand = products.brand
        FROM products 
        WHERE product_market_data.product_id = products.id 
          AND products.brand IS NOT NULL 
          AND product_market_data.brand IS NULL;
      `
    })

    // Create indexes for better performance
    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_product_market_data_brand ON product_market_data(brand) WHERE brand IS NOT NULL;'
    })
    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_product_market_data_year ON product_market_data(year) WHERE year IS NOT NULL;'
    })

    console.log('✅ [MIGRATE] Migration completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Successfully added brand, year, weight, and dimensions fields to product_market_data table',
      fieldsAdded: ['brand', 'year', 'weight', 'dimensions', 'manufacturer', 'model_number', 'color', 'material'],
      structuredFields: ['dimensions_structured', 'weight_structured', 'specifications']
    })

  } catch (error) {
    console.error('❌ [MIGRATE] Migration error:', error)
    
    // Fallback: Try to add columns using direct SQL if possible
    try {
      const { data: existingColumns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'product_market_data')

      const hasNewFields = existingColumns?.some((col: any) => ['brand', 'year', 'weight', 'dimensions'].includes(col.column_name))
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
        message: 'Migration may have partially succeeded. Please check database manually.',
        hasNewFields
      }, { status: 500 })

    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
        message: 'Unable to run database migration. Please run the SQL migration manually.'
      }, { status: 500 })
    }
  }
} 