import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CREDIT_PACKS, type CreditPackKey } from '@/lib/plans';
import { getRazorpayClient } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });

  const { pack } = await req.json();
  const packKey = pack as CreditPackKey;
  const selected = CREDIT_PACKS[packKey];

  if (!selected) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid credit pack' } }, { status: 400 });
  }

  try {
    const order = await getRazorpayClient().orders.create({
      amount: selected.amountInr * 100,
      currency: 'INR',
      receipt: `credits_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, pack: packKey, credits: String(selected.credits) },
    });

    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: selected.amountInr * 100,
      currency: 'INR',
      status: 'pending',
      type: 'credits',
      razorpay_order_id: order.id,
      metadata: { pack: packKey, credits: selected.credits },
    });

    return NextResponse.json({ success: true, order, pack: selected });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create credit purchase order';
    return NextResponse.json({ success: false, error: { code: 'ORDER_CREATE_FAILED', message } }, { status: 500 });
  }
}
