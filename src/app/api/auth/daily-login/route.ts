import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const iKey  = `daily_login:${user.id}:${today}`;

  // award_points handles idempotency via CTE-locked insert
  const { error } = await supabase.rpc('award_points', {
    u_id:    user.id,
    p_count: 2,
    e_type:  'daily_login',
    ent_id:  user.id,       // entity is the user themselves
    i_key:   iKey
  });

  if (error) {
    console.error('Daily login award error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }

  // Update streak logic
  await supabase.rpc('update_login_streak', { u_id: user.id });

  // Check for Streak Master badge (distinct daily logins in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count } = await supabase
    .from('reputation_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'daily_login')
    .gte('created_at', sevenDaysAgo.toISOString());

  if ((count ?? 0) >= 7) {
    const { data: badge } = await supabase
      .from('badges')
      .select('id')
      .eq('name', 'Streak Master')
      .single();

    if (badge) {
      await supabase
        .from('user_badges')
        .upsert(
          { user_id: user.id, badge_id: badge.id },
          { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
        );
    }
  }

  return NextResponse.json({ success: true });
}
