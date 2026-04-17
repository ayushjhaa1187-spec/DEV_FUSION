import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'all_time';
  const branch = searchParams.get('branch');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    // Try dedicated views first, fall back to profiles table
    const viewName = period === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_alltime';
    
    let rawEntries: any[] = [];
    let usedFallback = false;

    const { data: viewData, error: viewError } = await supabase
      .from(viewName)
      .select('*')
      .limit(limit);

    if (viewError || !viewData || viewData.length === 0) {
      // Fallback: query profiles table directly
      usedFallback = true;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, reputation_points, college, branch, recruitment_opt_in')
        .order('reputation_points', { ascending: false })
        .limit(limit);

      if (profileError) throw profileError;
      rawEntries = profileData || [];
    } else {
      rawEntries = viewData;
    }

    // Fetch current user rank if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let currentUser = null;

    if (user) {
      if (usedFallback) {
        const userEntry = rawEntries.find(e => e.id === user.id);
        if (userEntry) {
          currentUser = formatEntry(userEntry, period, true, rawEntries.findIndex(e => e.id === user.id) + 1);
        }
      } else {
        // Try both id and user_id column names
        const userEntry = rawEntries.find(e => e.id === user.id || e.user_id === user.id);
        if (userEntry) {
          const rank = rawEntries.findIndex(e => (e.id === user.id || e.user_id === user.id)) + 1;
          currentUser = formatEntry(userEntry, period, true, rank);
        }
      }
    }

    const formattedEntries = (rawEntries || []).map((e, idx) => formatEntry(e, period, false, idx + 1));

    return NextResponse.json({ 
      entries: formattedEntries, 
      currentUser 
    });
  } catch (err: any) {
    console.error('[Leaderboard API Error]', err.message);
    return NextResponse.json({ error: err.message, entries: [], currentUser: null }, { status: 500 });
  }
}

function formatEntry(e: any, period: string, isCurrentUser: boolean, rank: number) {
  const points = period === 'weekly' 
    ? (e.weekly_points ?? e.reputation_points ?? 0)
    : (e.reputation_points ?? 0);

  return {
    rank,
    user_id: e.id || e.user_id,
    name: e.full_name || e.username || 'Anonymous',
    username: e.username || 'user',
    college: e.college || e.branch || '',
    avatar_url: e.avatar_url || null,
    badge: getBadge(e.reputation_points ?? 0),
    points,
    change: 0,
    recruitment_opt_in: e.recruitment_opt_in ?? false,
    is_current_user: isCurrentUser,
  };
}

function getBadge(points: number): string {
  if (points >= 1000) return 'Legend';
  if (points >= 250) return 'Expert';
  if (points >= 50) return 'Helper';
  return 'Newcomer';
}
