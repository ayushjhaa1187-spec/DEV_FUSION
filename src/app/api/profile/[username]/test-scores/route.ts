import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createSupabaseServer();

  try {
    // 1. Resolve username to userId
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch test results (practice activity)
    const { data: scores, error: scoresError } = await supabase
      .from('test_attempts')
      .select(`
        id,
        score,
        started_at,
        global_tests (
          topic
        )
      `)
      .eq('user_id', profile.id)
      .not('score', 'is', null)
      .order('started_at', { ascending: true })
      .limit(20);

    if (scoresError) throw scoresError;

    // 3. Format data for Recharts (line chart)
    const chartData = (scores || []).map((s: any) => ({
      date: new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: s.score,
      test: s.global_tests?.topic || 'Practice Test'
    }));

    return NextResponse.json(chartData);
  } catch (error: any) {
    console.error('Test scores API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
