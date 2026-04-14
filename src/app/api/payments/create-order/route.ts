import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slot_id } = await req.json();

    if (!slot_id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    // 1. Fetch slot details and mentor price
    const { data: slot, error: slotError } = await supabase
      .from('mentor_slots')
      .select(`
        id,
        status,
        mentor_profiles (
          id,
          hourly_rate
        )
      `)
      .eq('id', slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.status !== 'available') {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 400 });
    }

    const mentorProfile = slot.mentor_profiles as any;
    const amount = (mentorProfile?.hourly_rate || 250) * 100; // Razorpay expects amount in paise

    // 2. Create Razorpay order
    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${slot_id}_${user.id.substring(0, 8)}`,
      notes: {
        slot_id,
        student_id: user.id
      }
    };

    const order = await getRazorpayClient().orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error('[Create Order Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}
