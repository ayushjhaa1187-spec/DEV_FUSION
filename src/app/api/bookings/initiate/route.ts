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
    const { mentor_id, slot_id } = await req.json();

    if (!mentor_id || !slot_id) {
        return NextResponse.json({ success: false, error: 'Missing mentor_id or slot_id' }, { status: 400 });
    }

    // 1. Fetch Slot and Mentor Profile
    const { data: slot, error: slotError } = await supabase
        .from('availability_slots')
        .select('*, mentor_profiles(session_fee, default_meeting_link)')
        .eq('id', slot_id)
        .single();

    if (slotError || !slot) {
        throw new Error('Slot not found');
    }

    const mentor = slot.mentor_profiles as any;
    const fee = mentor.session_fee || 0;

    // 2. Check if slot is available
    if (slot.status !== 'available') {
        return NextResponse.json({ success: false, error: 'Slot already booked' }, { status: 409 });
    }

    // 3. Create initial booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            student_id: user.id,
            mentor_id: mentor_id,
            slot_id: slot_id,
            meeting_link: mentor.default_meeting_link || 'https://meet.google.com/new',
            amount: fee,
            status: fee === 0 ? 'confirmed' : 'pending'
        })
        .select('id')
        .single();

    if (bookingError) throw bookingError;

    // 4. If free, mark slot as booked immediately
    if (fee === 0) {
        await supabase.from('availability_slots').update({ status: 'booked' }).eq('id', slot_id);
        return NextResponse.json({ 
            success: true, 
            booking_id: booking.id, 
            order_id: null,
            status: 'confirmed' 
        });
    }

    // 5. Razorpay Integration
    // (Existing Razorpay logic remains but update the update call later)
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ 
            success: true, 
            booking_id: booking.id, 
            order_id: 'order_simulated_' + booking.id.substring(0, 8),
            status: 'pending',
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

    // We'll store the order ID in the transaction record later or in metadata
    // For now, I'll just return it. 
    // In many implementations, we create a transaction record now in 'pending' status.
    const { error: txErr } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: fee,
        gateway: 'razorpay',
        gateway_order_id: order.id,
        status: 'pending'
    });

    return NextResponse.json({ 
        success: true, 
        booking_id: booking.id, 
        order_id: order.id,
        status: 'pending',
        amount: fee * 100
    });

  } catch (error: any) {
    console.error('Booking initiation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
