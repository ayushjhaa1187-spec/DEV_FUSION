import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!booking_id) {
        return NextResponse.json({ success: false, error: 'Missing booking_id' }, { status: 400 });
    }

    // 1. Fetch Booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

    if (bookingError || !booking) {
        throw new Error('Booking not found');
    }

    if (booking.student_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 2. Simulated payment checks (if missing Razorpay env keys)
    if (!process.env.RAZORPAY_KEY_SECRET && razorpay_order_id?.startsWith('order_simulated_')) {
        // Simulated Verify
        await supabase.from('bookings')
            .update({ 
                payment_status: 'COMPLETED',
                razorpay_payment_id: razorpay_payment_id || 'simulated_payment_' + Date.now(),
            })
            .eq('id', booking.id);
            
        return NextResponse.json({ success: true, message: 'Simulated Payment Verified' });
    }

    // 3. Real Razorpay Signature Verification
    if (!process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ success: false, error: 'Server misconfigured for payments' }, { status: 500 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        // Payment failed/tampered
        await supabase.from('bookings')
            .update({ payment_status: 'FAILED' })
            .eq('id', booking.id);
            
        return NextResponse.json({ success: false, error: 'Invalid Payment Signature' }, { status: 400 });
    }

    // 4. Update booking to successful
    await supabase.from('bookings')
        .update({ 
            payment_status: 'COMPLETED',
            razorpay_payment_id,
            razorpay_signature
        })
        .eq('id', booking.id);

    return NextResponse.json({ success: true, message: 'Payment Verified Successfully' });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
