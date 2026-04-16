import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, status: 'unauthorized' }, { status: 401 });
    }

    // Pre-flight check: Ensure profile exists to avoid RLS/Foreign Key siloes
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.warn('[daily-login] No profile yet—provisioning bridge log.');
      return NextResponse.json({ success: true, status: 'provisioning_delay' });
    }

    const today = new Date().toISOString().split('T')[0];
    const idempotencyKey = `daily_login_${user.id}_${today}`;

    // BACKGROUND SYNC (Global Catch-All): Never block the UI over points
    try {
      // 1. Award daily login points
      const { error: repError } = await supabase.rpc('update_reputation', {
        p_user_id:         user.id,
        p_action:          'daily_login',
        p_entity_id:       null,
        p_metadata:        {},
        p_idempotency_key: idempotencyKey,
      });
      if (repError) console.warn('[daily-login] Reputation synced failed (ignoring):', repError.message);

      // 2. Update login streak
      const { error: streakError } = await supabase.rpc('update_login_streak', { u_id: user.id });
      if (streakError) console.warn('[daily-login] Streak sync failed (ignoring):', streakError.message);

    } catch (bgErr) {
      console.warn('[daily-login] Background gamification skipped due to link instability.');
    }

    return NextResponse.json({ success: true, status: 'processed_or_skipped' }, { status: 200 });
  } catch (err: any) {
    console.error('[daily-login] Fatal bridge recovery activated:', err.message || err);
    return NextResponse.json({ success: true, status: 'recovered' }, { status: 200 });
  }
}
