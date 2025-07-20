// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get user ID from auth (you'll need to implement this)
    const userId = 'user-id-here' // TODO: Get from auth

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

    const dashboardStats = {
      totalProcessing: (statusCounts['processing'] || 0) + 
                      (statusCounts['phase_1'] || 0) + 
                      (statusCounts['phase_2'] || 0) + 
                      (statusCounts['phase_3'] || 0) + 
                      (statusCounts['phase_4'] || 0),
      totalPaused: statusCounts['paused'] || 0,
      totalError: statusCounts['error'] || 0,
      totalCompleted: statusCounts['completed'] || 0,
      totalPublished: statusCounts['published'] || 0
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}