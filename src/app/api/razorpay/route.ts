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

    if (!amount || amount < 0 || !mentor_id) {
      return NextResponse.json({ error: 'Invalid operation parameters' }, { status: 400 });
    }

    // Server-side Price Verification (Harden against tampering)
    const { data: mentor } = await supabase
      .from('mentor_profiles')
      .select('hourly_rate')
      .eq('id', mentor_id)
      .single();

    if (!mentor || mentor.hourly_rate !== amount) {
      console.warn(`[Security] Price mismatch detected for user ${user.id}. Requested: ${amount}, Actual: ${mentor?.hourly_rate}`);
      return NextResponse.json({ error: 'System integrity violation: price mismatch' }, { status: 400 });
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
