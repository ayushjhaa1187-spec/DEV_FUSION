import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[daily-login] No user found for session');
      return NextResponse.json({ success: false, status: 'unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const idempotencyKey = `daily_login_${user.id}_${today}`;
    console.log(`[daily-login] Processing for user ${user.id} with key ${idempotencyKey}`);

    // 1. Award daily login points
    const { error: repError } = await supabase.rpc('update_reputation', {
      p_user_id:         user.id,
      p_action:          'daily_login',
      p_entity_id:       null,
      p_metadata:        {},
      p_idempotency_key: idempotencyKey,
    });

    if (repError) {
      console.warn('[daily-login] Reputation RPC issue:', repError.message);
    }

    // 2. Update login streak
    const { error: streakError } = await supabase.rpc('update_login_streak', { u_id: user.id });
    if (streakError) {
      console.warn('[daily-login] Streak update issue:', streakError.message);
    }

    // 3. Automated Badge Check
    try {
      await checkAndAwardBadges(user.id);
    } catch (badgeErr) {
       console.warn('[daily-login] Badge check skipped:', badgeErr);
    }

    return NextResponse.json({ success: true, status: 'processed' }, { status: 200 });
  } catch (err: any) {
    console.error('[daily-login] Fail-safe recovery triggered:', err.message || err);
    // Return 200 even on error to prevent blocking the client-side neural sync
    return NextResponse.json({ 
      success: true, 
      status: 'recovered', 
      warning: 'Background processing failed partially.' 
    }, { status: 200 });
  }
}
