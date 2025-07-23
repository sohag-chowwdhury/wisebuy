import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/ai-services';

export async function POST(req: NextRequest) {
  try {
    const { productQuery } = await req.json();
    
    if (!productQuery) {
      return NextResponse.json({ error: 'Product query is required' }, { status: 400 });
    }
    
    console.log('🧪 [DEBUG] Testing AI specs for:', productQuery);
    
    const geminiService = new GeminiService();
    const specs = await geminiService.getSpecifications(productQuery);
    
    console.log('🧪 [DEBUG] AI returned:', specs);
    
    return NextResponse.json({
      productQuery,
      specs,
      keyFeaturesCount: specs?.keyFeatures?.length || 0,
      hasRealFeatures: specs?.keyFeatures?.length > 0 && 
                      !specs.keyFeatures.some(f => 
                        f.includes('Electronic device') || 
                        f.includes('Power management') ||
                        f.includes('User interface')
                      )
    });
    
  } catch (error) {
    console.error('🧪 [DEBUG] Error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 