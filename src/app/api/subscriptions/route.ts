import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });

  if (!process.env.RAZORPAY_KEY_ID) {
    console.error('RAZORPAY_KEY_ID is missing');
    return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
  }

  try {
    const { plan_id } = await req.json();

    if (!plan_id) {
      return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 });
    }

    const options = {
      plan_id,
      customer_notify: 1,
      total_count: 120, // max billing cycles
      notes: {
        user_id: user.id
      }
    };

    const subscription = await getRazorpayClient().subscriptions.create(options);
    
    // Store pending subscription in database mapping it to user
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        plan_id: plan_id,
        status: subscription.status,
      }, { onConflict: 'user_id' });

    if (dbError) {
        console.error('Database Error storing subscription:', dbError);
        return NextResponse.json({ error: 'Could not record subscription in database' }, { status: 500 });
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error('Razorpay Subscription Error:', error);
    return NextResponse.json({ error: error.message || 'Payment service error' }, { status: 500 });
  }
}
