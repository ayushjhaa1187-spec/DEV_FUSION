import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { consumeCredit, type AiAction } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });

  const { action } = await req.json();
  const valid = ['ai_doubt_solve', 'ai_test_generate', 'ai_coaching_report', 'ai_study_plan'];
  if (!valid.includes(action)) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid action' } }, { status: 400 });
  }

  const result = await consumeCredit(user.id, action as AiAction, supabase);

  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Insufficient credits' }, balance: result.balance },
      { status: 402 }
    );
  }

  return NextResponse.json({ success: true, deducted: result.deducted, remainingBalance: result.remainingBalance });
}
