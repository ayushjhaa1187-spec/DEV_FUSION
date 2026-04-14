import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';

const PACKS: Record<string, { credits: number; amount: number }> = {
  starter: { credits: 50, amount: 4900 },
  value: { credits: 150, amount: 12900 },
  bulk: { credits: 500, amount: 34900 },
  exam_sprint: { credits: 1000, amount: 59900 },
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pack } = await req.json();
  if (!pack || !PACKS[pack]) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  const selected = PACKS[pack];
  const order = await getRazorpayClient().orders.create({
    amount: selected.amount,
    currency: 'INR',
    notes: { user_id: user.id, pack, credits: String(selected.credits), type: 'credit_purchase' },
  });

  return NextResponse.json({ order, pack: selected });
}
