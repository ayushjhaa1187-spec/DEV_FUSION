import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'all_time';
  const branch = searchParams.get('branch');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const viewName = period === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_alltime';
    
    let query = supabase
      .from(viewName)
      .select('*')
      .limit(limit);

    if (branch && branch !== 'all') {
      query = query.eq('branch', branch);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    // Fetch current user rank if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let currentUser = null;

    if (user) {
      const { data: userEntry } = await supabase
        .from(viewName)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userEntry) {
        currentUser = {
          ...userEntry,
          is_current_user: true,
          name: userEntry.full_name || userEntry.username,
          points: period === 'weekly' ? userEntry.weekly_points : userEntry.reputation_points
        };
      }
    }

    const formattedEntries = (entries || []).map(e => ({
      ...e,
      user_id: e.id,
      name: e.full_name || e.username,
      points: period === 'weekly' ? e.weekly_points : e.reputation_points,
      badge: getBadge(e.reputation_points),
      change: 0 // View doesn't track change yet
    }));

    return NextResponse.json({ 
      entries: formattedEntries, 
      currentUser 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getBadge(points: number): string {
  if (points >= 1000) return 'Legend';
  if (points >= 250) return 'Expert';
  if (points >= 50) return 'Helper';
  return 'Newcomer';
}
