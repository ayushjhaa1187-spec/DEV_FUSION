import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all badges and identify earned ones in a single pass
  const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
    supabase.from('badges').select('*').order('requirement_points'),
    supabase.from('user_badges').select('badge_id, created_at').eq('user_id', user.id)
  ]);

  const earnedIds = new Set((userBadges ?? []).map(ub => ub.badge_id));
  const earnedDates = Object.fromEntries(
    (userBadges ?? []).map(ub => [ub.badge_id, ub.created_at])
  );

  const result = (allBadges ?? []).map(b => ({
    ...b,
    earned:    earnedIds.has(b.id),
    earned_at: earnedDates[b.id] ?? null
  }));

  return NextResponse.json(result);
}
