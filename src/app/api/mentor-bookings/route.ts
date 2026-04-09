import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slot_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 1. Verify slot is available and get mentor pricing
    const { data: slot, error: slotError } = await supabase
      .from('mentor_slots')
      .select('mentor_id, is_booked, start_time, mentor_profiles(hourly_rate)')
      .eq('id', slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 400 });
    }

    const mentorProfile = slot.mentor_profiles as any;
    const hourlyRate = mentorProfile?.hourly_rate || 0;

    // 2. Enforce Razorpay Signature for paid sessions
    if (hourlyRate > 0) {
      if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
        return NextResponse.json({ error: 'Payment verification details missing' }, { status: 402 });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // 3. Create confirmed booking with Jitsi link
    const meetingRoomId = `sb-${slot_id}-${Math.random().toString(36).substring(7)}`;
    const { data: booking, error: bookingError } = await supabase
      .from('mentor_bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: 'confirmed', 
        meeting_link: `https://meet.jit.si/${meetingRoomId}`,
        payment_id: razorpay_payment_id || null,
        amount_paid: hourlyRate
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // 4. Record in transactions table
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: hourlyRate * 100, // stored in paise
      status: 'completed',
      type: 'session',
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || null,
      entity_id: slot_id
    });

    // 5. Mark slot as booked
    await supabase
      .from('mentor_slots')
      .update({ is_booked: true })
      .eq('id', slot_id);

    // 6. Notify mentor
    await supabase.from('notifications').insert({
      user_id: slot.mentor_id,
      title: 'Session Successfully Booked!',
      message: `A student secured a session for ${new Date(slot.start_time).toLocaleString()}. View your dashboard for details.`,
      type: 'booking_confirmed',
      link: '/dashboard/sessions'
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}
