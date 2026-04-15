import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { planType } = await req.json(); // e.g., 'pro', 'elite', 'credit_pack'
    
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Determine pricing (in paise - multiply INR by 100)
    let amount = 0;
    if (planType === 'pro') amount = 149 * 100;
    if (planType === 'elite') amount = 349 * 100;
    if (planType === 'credit_pack') amount = 49 * 100;

    if (amount === 0) return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        planType: planType,
      },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
