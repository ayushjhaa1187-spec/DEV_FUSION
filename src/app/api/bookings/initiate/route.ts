import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mentor_id, start_timestamp } = await req.json();

    if (!mentor_id || !start_timestamp) {
        return NextResponse.json({ success: false, error: 'Missing mentor_id or start_timestamp' }, { status: 400 });
    }

    // 1. Fetch Mentor Profile for Fee and Link
    const { data: mentor, error: mentorError } = await supabase
        .from('mentor_profiles')
        .select('session_fee, default_meeting_link')
        .eq('id', mentor_id)
        .single();

    if (mentorError || !mentor) {
        throw new Error('Mentor not found');
    }

    const fee = mentor.session_fee || 0;
    const end_timestamp = new Date(new Date(start_timestamp).getTime() + 30 * 60000).toISOString();

    // 2. Check overlap to prevent race conditions
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('mentor_id', mentor_id)
        .in('payment_status', ['COMPLETED', 'FREE', 'PENDING'])
        .lt('start_timestamp', end_timestamp)
        .gt('end_timestamp', start_timestamp);

    if (conflicts && conflicts.length > 0) {
        return NextResponse.json({ success: false, error: 'Slot already booked' }, { status: 409 });
    }

    // 3. Create initial booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            student_id: user.id,
            mentor_id: mentor_id,
            start_timestamp,
            end_timestamp,
            meeting_link: mentor.default_meeting_link || 'https://meet.google.com/new',
            amount_paid: fee,
            payment_status: fee === 0 ? 'FREE' : 'PENDING'
        })
        .select('id')
        .single();

    if (bookingError) throw bookingError;

    // 4. Handle Pricing
    if (fee === 0) {
        return NextResponse.json({ 
            success: true, 
            booking_id: booking.id, 
            order_id: null,
            status: 'FREE' 
        });
    }

    // 5. Razorpay Integration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // Fallback for simulation if keys are missing in env
        return NextResponse.json({ 
            success: true, 
            booking_id: booking.id, 
            order_id: 'order_simulated_' + booking.id.substring(0, 8),
            status: 'PENDING',
            amount: fee * 100
        });
    }

    const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
        amount: fee * 100, // in paise
        currency: "INR",
        receipt: `receipt_${booking.id}`,
    });

    // Update with razorpay_order_id
    await supabase.from('bookings')
        .update({ razorpay_order_id: order.id })
        .eq('id', booking.id);

    return NextResponse.json({ 
        success: true, 
        booking_id: booking.id, 
        order_id: order.id,
        status: 'PENDING',
        amount: fee * 100
    });

  } catch (error: any) {
    console.error('Booking initiation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
