import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  try {
    const { data: doubts, error } = await supabase
      .from('trending_doubts')
      .select('*, profiles(full_name, avatar_url, username), subjects(name)')
      .limit(10);

    if (error) throw error;

    return NextResponse.json(doubts);
  } catch (error: any) {
    console.error('Trending doubts fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
