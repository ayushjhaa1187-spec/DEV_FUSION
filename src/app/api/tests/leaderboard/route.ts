import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }

  const supabase = await createSupabaseServer();

  try {
    // Attempting to use the recommended view 'test_leaderboard'
    // Fallback: Aggregate manually if view doesn't exist yet
    const { data: viewData, error: viewError } = await supabase
      .from('test_leaderboard')
      .select('*')
      .eq('topic', topic)
      .limit(10);

    if (viewData && !viewError) {
      return NextResponse.json(viewData);
    }

    // Fallback manual query
    const { data, error } = await supabase
      .from('practice_attempts')
      .select(`
        user_id,
        score,
        practice_tests!inner(topic),
        profiles:user_id(username, avatar_url)
      `)
      .eq('practice_tests.topic', topic)
      .order('score', { ascending: false });

    if (error) throw error;

    const aggregated = Object.values((data || []).reduce((acc: any, curr: any) => {
      const uId = curr.user_id;
      if (!acc[uId] || curr.score > acc[uId].best_score) {
        acc[uId] = {
          username: curr.profiles?.username || 'Unknown',
          avatar_url: curr.profiles?.avatar_url,
          best_score: curr.score,
          attempts: (acc[uId]?.attempts || 0) + 1
        };
      } else {
        acc[uId].attempts += 1;
      }
      return acc;
    }, {})).sort((a: any, b: any) => b.best_score - a.best_score).slice(0, 10);

    return NextResponse.json(aggregated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
