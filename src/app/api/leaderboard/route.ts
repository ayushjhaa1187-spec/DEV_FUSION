import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get('timeframe') || 'all'; // 'weekly', 'monthly', 'all'
  const branch = searchParams.get('branch');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  let query = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, reputation_points, branch, college, login_streak');

  if (branch && branch !== 'all') {
    query = query.eq('branch', branch);
  }

  if (timeframe === 'all') {
    const { data, error } = await query
      .order('reputation_points', { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    // Time-based query using reputation_ledger table
    const days = timeframe === 'weekly' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: events, error: eventError } = await supabase
      .from('reputation_ledger')
      .select('user_id, points_delta')
      .gte('created_at', since.toISOString());

    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

    // Aggregate points by user
    const userPoints: Record<string, number> = {};
    (events || []).forEach((e: { user_id: string; points_delta: number }) => {
      userPoints[e.user_id] = (userPoints[e.user_id] || 0) + e.points_delta;
    });

    // Get profiles for these users
    const userIds = Object.keys(userPoints);
    if (userIds.length === 0) return NextResponse.json([]);

    let profileQuery = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, reputation_points, branch, college, login_streak');

    if (branch && branch !== 'all') {
      profileQuery = profileQuery.eq('branch', branch);
    }

    const { data: profiles, error: profileError } = await profileQuery.in('id', userIds);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // Map points back and sort
    const rankedData = (profiles || [])
      .map((p: Record<string, unknown>) => ({ ...p, period_points: userPoints[p.id as string] || 0 }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        (b.period_points as number) - (a.period_points as number)
      )
      .slice(0, limit);

    return NextResponse.json(rankedData);
  }
}
