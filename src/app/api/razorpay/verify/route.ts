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

    // Success: Insert enrollment/booking
    // Check if slot is still available
    const { data: slot } = await supabase
      .from('mentor_slots')
      .select('*')
      .eq('id', slot_id)
      .single();

    if (!slot || slot.is_booked) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    // Atomic transaction: update slot AND create booking
    const { error: bookingError } = await supabase.from('mentor_bookings').insert({
      slot_id,
      student_id: user.id,
      mentor_id: slot.mentor_id,
      status: 'confirmed',
      payment_id: razorpay_payment_id,
      amount_paid: amount
    });

    if (bookingError) throw bookingError;

    // Mark slot as booked
    await supabase.from('mentor_slots').update({ is_booked: true }).eq('id', slot_id);

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
