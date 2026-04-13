import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const idempotencyKey = `daily_login:${user.id}:${today}`;

  // 1. Award daily login points via the consolidated RPC (idempotent via idempotency_key)
  //    Signature: update_reputation(p_user_id, p_action, p_entity_id, p_metadata, p_idempotency_key)
  const { error: repError } = await supabase.rpc('update_reputation', {
    p_user_id:         user.id,
    p_action:          'daily_login',
    p_entity_id:       null,
    p_metadata:        {},
    p_idempotency_key: idempotencyKey,
  });

  if (repError) {
    console.error('Daily login reputation error:', repError);
    return NextResponse.json({ success: false, error: repError.message }, { status: 500 });
  }

  // 2. Update login streak (handles increment / reset + last_login_at)
  const { error: streakError } = await supabase.rpc('update_login_streak', { u_id: user.id });
  if (streakError) {
    // Non-fatal: points were awarded, streak tracking is secondary
    console.error('Streak update error:', streakError);
  }

  // 3. Automated Badge Check
  await checkAndAwardBadges(user.id);

  return NextResponse.json({ success: true });
}
