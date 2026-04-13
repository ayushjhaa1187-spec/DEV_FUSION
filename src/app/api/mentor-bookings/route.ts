import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import { generateJitsiRoomName, getJitsiMeetUrl } from '@/lib/jitsi';
import { sendBookingConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slot_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 1. Verify slot is available and get mentor pricing
    const { data: slot, error: slotError } = await supabase
      .from('mentor_slots')
      .select('mentor_id, status, start_time, mentor_profiles(user_id, hourly_rate)')
      .eq('id', slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.status !== 'available') {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 400 });
    }

    const mentorProfile = slot.mentor_profiles as any;
    const sessionRate = mentorProfile?.hourly_rate || 0;

    // 2. Enforce Razorpay Signature for paid sessions
    if (sessionRate > 0) {
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
    const jitsiRoomName = generateJitsiRoomName(slot_id + '-' + user.id);
    const { data: booking, error: bookingError } = await supabase
      .from('mentor_bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: 'confirmed', 
        jitsi_room_name: jitsiRoomName,
        meeting_link: getJitsiMeetUrl(jitsiRoomName),
        payment_id: razorpay_payment_id || null,
        payment_status: sessionRate > 0 ? 'completed' : 'pending',
        amount_paid: sessionRate
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // 4. Mark slot as booked
    await supabase
      .from('mentor_slots')
      .update({ status: 'booked' })
      .eq('id', slot_id);

    // 5. Notify mentor with student details
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single();

    const studentName = studentProfile?.full_name || studentProfile?.username || 'A student';
    const slotTime = new Date(slot.start_time).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

      link: '/dashboard/sessions'
    });

    // 6. Send Emails
    const { data: mentorProfileData } = await supabase
      .from('profiles')
      .select('email, full_name, username')
      .eq('id', slot.mentor_profiles.user_id)
      .single();

    if (mentorProfileData?.email) {
      // Notify Mentor
      await sendBookingConfirmationEmail({
        to: mentorProfileData.email,
        isMentor: true,
        otherPartyName: studentName,
        startTime: slotTime,
        meetingUrl: booking.meeting_link
      });
    }

    if (user.email) {
       // Notify Student
       await sendBookingConfirmationEmail({
        to: user.email,
        isMentor: false,
        otherPartyName: mentorProfileData?.full_name || mentorProfileData?.username || 'Mentor',
        startTime: slotTime,
        meetingUrl: booking.meeting_link
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}

