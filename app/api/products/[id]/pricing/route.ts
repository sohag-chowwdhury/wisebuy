import { NextRequest, NextResponse } from 'next/server';
import { startPipelinePhaseRT } from '@/lib/supabase/realtime-database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const body = await request.json();

    console.log(`🔄 [API] Restarting Phase 3 (Smart Pricing) for product: ${productId}`);

    // Restart Phase 3 using the real-time database function
    const phase = await startPipelinePhaseRT(productId, 3, 'Smart Pricing');

    console.log(`✅ [API] Phase 3 restarted successfully for product: ${productId}`);

    return NextResponse.json({
      success: true,
      message: 'Smart Pricing phase restarted successfully',
      phase: {
        id: phase.id,
        product_id: phase.product_id,
        phase_number: phase.phase_number,
        phase_name: phase.phase_name,
        status: phase.status,
        progress_percentage: phase.progress_percentage || 0,
        started_at: phase.started_at,
      }
    });

  } catch (error) {
    console.error(`❌ [API] Error restarting Phase 3:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart Smart Pricing phase'
    }, { status: 500 });
  }
} 