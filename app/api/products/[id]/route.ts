import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { id } = params;
  const updates = await request.json();

  // Only allow updating certain fields
  const allowedFields = ['name', 'model', 'brand', 'category'];
  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (updates[key]) updateData[key] = updates[key];
  }
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: true });
} 