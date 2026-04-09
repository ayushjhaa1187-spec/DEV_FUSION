import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slot_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 1. Verify Razorpay Signature (Security first)
    if (razorpay_signature) {
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
    }

    // 2. Verify slot is available
    const { data: slot, error: slotError } = await supabase
      .from('mentor_slots')
      .select('mentor_id, is_booked, start_time')
      .eq('id', slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 400 });
    }

    // 3. Create confirmed booking with Jitsi link
    const meetingRoomId = `skillbridge-${slot_id}-${Math.random().toString(36).substring(7)}`;
    const { data: booking, error: bookingError } = await supabase
      .from('mentor_bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: 'confirmed', 
        meeting_link: `https://meet.jit.si/${meetingRoomId}`,
        payment_id: razorpay_payment_id // Tracking payment
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // 4. Mark slot as booked
    await supabase
      .from('mentor_slots')
      .update({ is_booked: true })
      .eq('id', slot_id);

    // 5. Notify mentor
    await supabase.from('notifications').insert({
      user_id: slot.mentor_id,
      title: 'New Session Booked!',
      message: `A student has booked a 30-minute session for ${new Date(slot.start_time).toLocaleString()}.`,
      type: 'booking_confirmed',
      link: '/dashboard/sessions'
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
