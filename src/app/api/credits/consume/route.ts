import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { consumeCredit, type AiAction } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  const result = await consumeCredit(user.id, action as AiAction, supabase);
  if (!result.allowed) {
    return NextResponse.json({ error: 'Insufficient credits', reason: result.reason, balance: result.balance }, { status: 402 });
  }

  return NextResponse.json(result);
}
