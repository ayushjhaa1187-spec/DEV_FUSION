import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    // Fetch doubts in last 7 days
    const { count: doubtsCount } = await supabase
      .from('doubts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .gte('created_at', dateStr);

    // Fetch practice attempts in last 7 days
    const { count: testsCount } = await supabase
      .from('practice_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', dateStr);

    // Fetch answers in last 7 days
    const { count: answersCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .gte('created_at', dateStr);

    return NextResponse.json({
      doubts: doubtsCount || 0,
      tests: testsCount || 0,
      answers: answersCount || 0,
      period: 'last_7_days'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
