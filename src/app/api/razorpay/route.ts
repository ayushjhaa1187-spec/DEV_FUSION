import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY environment variables are missing');
    return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
  }

  const razorpay = getRazorpayClient();

  try {
    const { amount, mentor_id, slot_id } = await req.json();

    if (!amount || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Orders are created in paise (1 INR = 100 paise)
    const options = {
      amount: amount * 100, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        mentor_id,
        slot_id,
        user_id: user.id
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      ...order,
      order_id: order.id, // Compatibility for frontend
      key_id: process.env.RAZORPAY_KEY_ID,
      currency: order.currency || 'INR',
      amount: order.amount
    });
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Payment service error' }, { status: 500 });
  }
}
