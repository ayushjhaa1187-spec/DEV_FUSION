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
        // Find existing pending transaction or create one
        const { data: tx } = await supabase
            .from('transactions')
            .select('id')
            .eq('gateway_order_id', razorpay_order_id)
            .single();

        await supabase.from('transactions')
            .update({ status: 'successful' })
            .eq('gateway_order_id', razorpay_order_id);

        await supabase.from('bookings')
            .update({ 
                status: 'confirmed',
                transaction_id: tx?.id
            })
            .eq('id', booking.id);
            
        // Mark slot as booked
        if (booking.slot_id) {
            await supabase.from('availability_slots').update({ status: 'booked' }).eq('id', booking.slot_id);
        }

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
        // Update transaction to failed
        await supabase.from('transactions')
            .update({ status: 'failed' })
            .eq('gateway_order_id', razorpay_order_id);

        await supabase.from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', booking.id);
            
        return NextResponse.json({ success: false, error: 'Invalid Payment Signature' }, { status: 400 });
    }

    // 4. Update transaction and booking to successful
    const { data: updatedTx } = await supabase
        .from('transactions')
        .update({ 
            status: 'successful',
            gateway_payment_id: razorpay_payment_id,
            gateway_signature: razorpay_signature
        })
        .eq('gateway_order_id', razorpay_order_id)
        .select()
        .single();

    await supabase.from('bookings')
        .update({ 
            status: 'confirmed',
            transaction_id: updatedTx?.id
        })
        .eq('id', booking.id);

    // Mark slot as booked
    if (booking.slot_id) {
        await supabase.from('availability_slots').update({ status: 'booked' }).eq('id', booking.slot_id);
    }

    return NextResponse.json({ success: true, message: 'Payment Verified Successfully' });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
