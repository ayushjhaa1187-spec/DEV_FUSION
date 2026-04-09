import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { id } = await params;

  try {
    // 1. Get current doubt subject
    const { data: currentDoubt } = await supabase
      .from('doubts')
      .select('subject_id, title')
      .eq('id', id)
      .single();

    if (!currentDoubt) return NextResponse.json([]);

    // 2. Recommend based on subject + keyword overlap (simple)
    const { data: recommendations } = await supabase
      .from('doubts')
      .select('id, title, created_at, subjects(name)')
      .eq('subject_id', currentDoubt.subject_id)
      .neq('id', id)
      .limit(4);

    return NextResponse.json(recommendations || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
