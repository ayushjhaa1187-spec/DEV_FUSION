import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });

  try {
    const { amount, type, entityId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        type,
        entityId
      }
    };

    const order = await razorpay.orders.create(options);

    // Initial transaction record
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: amount * 100,
      currency: 'INR',
      status: 'pending',
      type,
      razorpay_order_id: order.id,
      entity_id: type === 'session' ? entityId : null
    });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
      // We still return the order, but verification might fail if record is missing.
      // In a real app, you'd want this to be atomic or handle retries.
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Payment service error' }, { status: 500 });
  }
}
