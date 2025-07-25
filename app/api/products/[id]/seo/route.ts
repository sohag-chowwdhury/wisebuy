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

    console.log(`🔄 [API] Restarting Phase 4 (SEO & Publishing) for product: ${productId}`);

    // Restart Phase 4 using the real-time database function
    const phase = await startPipelinePhaseRT(productId, 4, 'SEO & Publishing');

    console.log(`✅ [API] Phase 4 restarted successfully for product: ${productId}`);

    return NextResponse.json({
      success: true,
      message: 'SEO & Publishing phase restarted successfully',
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
    console.error(`❌ [API] Error restarting Phase 4:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart SEO & Publishing phase'
    }, { status: 500 });
  }
} 