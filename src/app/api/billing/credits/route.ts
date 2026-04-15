import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CREDIT_PACKS, type CreditPackKey } from '@/lib/plans';
import { getRazorpayClient } from '@/lib/razorpay';

/**
 * GET /api/billing/credits
 * Returns the user's current AI credit balance.
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('credit_wallets')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, balance: data?.balance ?? 0 });
}

/**
 * POST /api/billing/credits
 * Initiates an order for an AI credit pack via Razorpay.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pack } = await req.json();
    const packKey = pack as CreditPackKey;
    const selected = CREDIT_PACKS[packKey];

    if (!selected) {
      return NextResponse.json({ success: false, error: 'Invalid credit pack' }, { status: 400 });
    }

    // Create Razorpay Order (One-time payment)
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: selected.amountInr * 100, // in paisa
      currency: 'INR',
      receipt: `credits_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { 
          user_id: user.id, 
          pack: packKey, 
          credits: String(selected.credits),
          type: 'one_time_credits'
      },
    });

    // Log the pending transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: selected.amountInr * 100,
      currency: 'INR',
      status: 'pending',
      type: 'credits',
      razorpay_order_id: order.id,
      metadata: { pack: packKey, credits: selected.credits },
    });

    return NextResponse.json({ 
        success: true, 
        order, 
        pack: { ...selected, id: packKey } 
    });
  } catch (err: any) {
    console.error('[billing/credits] POST error:', err);
    return NextResponse.json({ 
        success: false, 
        error: err.message || 'Failed to initiate credit purchase' 
    }, { status: 500 });
  }
}
