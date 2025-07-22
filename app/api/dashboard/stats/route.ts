// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Use demo user directly (no authentication required)
    const userId = '66c9ebb5-0eed-429a-acde-a0ecb85a8eb1'  // Demo user
    console.log('🔧 [STATS] Using demo user:', userId)

    // Get product counts by status
    const { data: stats, error } = await supabase
      .from('products')
      .select('status')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`)
    }

    // Calculate statistics
    const statusCounts = stats.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Include all processing-related statuses
    const processingStatuses = ['uploaded', 'processing', 'phase_1', 'phase_2', 'phase_3', 'phase_4']
    const totalProcessing = processingStatuses.reduce((sum, status) => sum + (statusCounts[status] || 0), 0)

    const dashboardStats = {
      totalProducts: stats.length, // Total count of all products
      totalProcessing,
      totalPaused: statusCounts['paused'] || 0,
      totalError: statusCounts['error'] || 0,
      totalCompleted: statusCounts['completed'] || 0,
      totalPublished: statusCounts['published'] || 0
    }

    console.log('📊 [STATS] Dashboard stats calculated:', dashboardStats)
    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('❌ [STATS] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}