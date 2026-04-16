import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const idempotencyKey = `daily_login:${user.id}:${today}`;

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
      console.warn('[daily-login] Reputation RLS or RPC error (skipped):', repError.message);
    }

    // 2. Update login streak
    await supabase.rpc('update_login_streak', { u_id: user.id });

    // 3. Automated Badge Check
    try {
      await checkAndAwardBadges(user.id);
    } catch (badgeErr) {
       console.warn('[daily-login] Badge check failed (skipped):', badgeErr);
    }
  } catch (err) {
    // Non-fatal: log and recover
    console.warn('[daily-login] Critical catch-all recovery:', err);
  }

  return NextResponse.json({ success: true });
}
