import { NextRequest, NextResponse } from 'next/server';
import { startPipelinePhaseRT } from '@/lib/supabase/realtime-database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const _body = await request.json();

    console.log(`🔄 [API] Restarting Phase 2 (Market Research) for product: ${productId}`);

    // Restart Phase 2 using the real-time database function
    const phase = await startPipelinePhaseRT(productId, 2, 'Market Research');

    console.log(`✅ [API] Phase 2 restarted successfully for product: ${productId}`);

    return NextResponse.json({
      success: true,
      message: 'Market Research phase restarted successfully',
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
    console.error(`❌ [API] Error restarting Phase 2:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart Market Research phase'
    }, { status: 500 });
  }
} 