import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      slot_id,
      amount
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 1. Create a transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount,
        gateway: 'razorpay',
        gateway_order_id: razorpay_order_id,
        gateway_payment_id: razorpay_payment_id,
        gateway_signature: razorpay_signature,
        status: 'successful'
      })
      .select()
      .single();

    if (txError) throw txError;

    // 2. Fetch slot to confirm availability and get mentor_id
    const { data: slot, error: slotErr } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', slot_id)
      .single();

    if (slotErr || !slot || slot.status === 'booked') {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    // 3. Create booking linked to the transaction
    const { error: bookingError } = await supabase.from('bookings').insert({
      slot_id,
      student_id: user.id,
      mentor_id: slot.mentor_id,
      status: 'confirmed',
      transaction_id: transaction.id,
      amount: amount
    });

    if (bookingError) throw bookingError;

    // 4. Mark slot as booked
    await supabase.from('availability_slots').update({ status: 'booked' }).eq('id', slot_id);

    // Audit log
    await logAuditEvent(user.id, 'payment_verified', 'mentor_booking', slot_id, {
      razorpay_order_id,
      razorpay_payment_id,
      mentor_id: slot.mentor_id,
      amount_paid: amount,
    });

    return NextResponse.json({ success: true, message: 'Session booked successfully' });
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
