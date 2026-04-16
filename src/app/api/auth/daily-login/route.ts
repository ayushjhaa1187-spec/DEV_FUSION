import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const idempotencyKey = `daily_login_${user.id}_${today}`;
  console.log(`[daily-login] Processing for user ${user.id} with key ${idempotencyKey}`);

  try {
    // 1. Award daily login points
    const { error: repError } = await supabase.rpc('update_reputation', {
      p_user_id:         user.id,
      p_action:          'daily_login',
      p_entity_id:       null,
      p_metadata:        {},
      p_idempotency_key: idempotencyKey,
    });

    if (repError) {
      console.warn('[daily-login] Reputation RPC error (non-fatal):', repError.message);
    }

    // 2. Update login streak
    const { error: streakError } = await supabase.rpc('update_login_streak', { u_id: user.id });
    if (streakError) {
      console.warn('[daily-login] Streak update failed (non-fatal):', streakError.message);
    }

    // 3. Automated Badge Check
    try {
      await checkAndAwardBadges(user.id);
    } catch (badgeErr) {
       console.warn('[daily-login] Badge check failed (non-fatal):', badgeErr);
    }

    return NextResponse.json({ success: true, status: 'processed' }, { status: 200 });
  } catch (err: any) {
    console.error('[daily-login] Critical catch-all recovery:', err.message || err);
    return NextResponse.json({ success: true, status: 'recovered', error: err.message }, { status: 200 });
  }
}
