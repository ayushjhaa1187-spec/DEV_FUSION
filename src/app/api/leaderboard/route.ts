import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  reputation_points: number;
  branch: string | null;
  college: string | null;
  login_streak: number;
};

function getBadge(points: number): string {
  if (points >= 1000) return 'Legend';
  if (points >= 250) return 'Expert';
  if (points >= 50) return 'Helper';
  return 'Newcomer';
}

function toEntry(p: ProfileRow, rank: number, periodPoints?: number) {
  return {
    rank,
    user_id: p.id,
    name: p.full_name || p.username || 'Anonymous',
    username: p.username,
    college: p.college || '',
    avatar: p.avatar_url || undefined,
    badge: getBadge(p.reputation_points),
    points: periodPoints !== undefined ? periodPoints : p.reputation_points,
    change: 0,
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  // Accept both 'period' (from frontend) and 'timeframe' params
  const period = searchParams.get('period') || searchParams.get('timeframe') || 'all_time';
  const branch = searchParams.get('branch');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Normalize period values
  const isWeekly = period === 'weekly';
  const isMonthly = period === 'monthly';
  const isTimeBased = isWeekly || isMonthly;

  let profileQuery = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, reputation_points, branch, college, login_streak');

  if (branch && branch !== 'all') {
    profileQuery = profileQuery.eq('branch', branch);
  }

  if (!isTimeBased) {
    // All-time leaderboard
    const { data, error } = await profileQuery
      .order('reputation_points', { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const entries = (data as ProfileRow[] || []).map((p, i) => toEntry(p, i + 1));
    return NextResponse.json({ entries, currentUser: undefined });
  } else {
    // Time-based query using reputation_events table
    const days = isWeekly ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: events, error: eventError } = await supabase
      .from('reputation_events')
      .select('user_id, points')
      .gte('created_at', since.toISOString());

    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

    const userPoints: Record<string, number> = {};
    (events || []).forEach((e: { user_id: string; points: number }) => {
      userPoints[e.user_id] = (userPoints[e.user_id] || 0) + e.points;
    });

    const userIds = Object.keys(userPoints);
    if (userIds.length === 0) return NextResponse.json({ entries: [], currentUser: undefined });

    let profileQ = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, reputation_points, branch, college, login_streak');

    if (branch && branch !== 'all') {
      profileQ = profileQ.eq('branch', branch);
    }

    const { data: profiles, error: profileError } = await profileQ.in('id', userIds);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    const sorted = (profiles as ProfileRow[] || [])
      .map((p) => ({ profile: p, pts: userPoints[p.id] || 0 }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, limit);

    const entries = sorted.map(({ profile, pts }, i) => toEntry(profile, i + 1, pts));
    return NextResponse.json({ entries, currentUser: undefined });
  }
}
