import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    type, // 'subscription' or 'session'
    entity_id // user_id for sub, slot_id for session
  } = await req.json();

  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  try {
    // 1. Update Transaction
    const { error: txError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (txError) throw txError;

      // 2. Handle Business Logic
    if (type === 'subscription') {
      // Activate Pro tier with resilience
      const fullPayload = {
        user_id: entity_id,
        tier: 'pro',
        plan: 'pro',
        start_date: new Date().toISOString(),
        is_active: true,
        status: 'active',
        updated_at: new Date().toISOString()
      };

      let { error: subError } = await supabase.from('subscriptions').upsert(fullPayload);
      
      // Fallback if schema mismatch (status, is_active, start_date might be missing)
      if (subError?.message?.includes('column')) {
        const fallbackPayload = {
          user_id: entity_id,
          tier: 'pro',
          updated_at: new Date().toISOString()
        };
        const { error: fallbackError } = await supabase.from('subscriptions').upsert(fallbackPayload);
        subError = fallbackError;
      }

      if (subError) throw subError;

      // Also update profiles tier for efficiency
      await supabase.from('profiles').update({ subscription_tier: 'pro' }).eq('id', entity_id);

    } else if (type === 'session') {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('mentor_bookings')
        .update({
          payment_status: 'completed',
          payment_id: razorpay_payment_id,
          status: 'confirmed'
        })
        .eq('slot_id', entity_id);
      
      if (bookingError) throw bookingError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
