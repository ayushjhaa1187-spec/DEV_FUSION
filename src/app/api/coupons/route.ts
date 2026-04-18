import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

const COUPONS: Record<string, 'pro' | 'elite'> = {
  'JAHNVI_FIND': 'elite',
  'AYUSH_DEAL26': 'pro',
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    const cleanCode = code?.toUpperCase().trim();

    if (!cleanCode || !COUPONS[cleanCode]) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 });
    }

    const plan = COUPONS[cleanCode];
    const now = new Date().toISOString();
    const oneYearLater = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();

    // 1. Check for existing subscription to handle lack of UNIQUE constraint
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const subData = {
      user_id: user.id,
      plan,
      status: 'active',
      razorpay_subscription_id: `coupon_${cleanCode}_${Date.now()}`,
      razorpay_plan_id: `coupon_${plan}`,
      current_period_start: now,
      current_period_end: oneYearLater,
      updated_at: now,
    };

    let subError;
    if (existingSub) {
      const { error } = await supabase.from('subscriptions').update(subData).eq('id', existingSub.id);
      subError = error;
    } else {
      const { error } = await supabase.from('subscriptions').insert(subData);
      subError = error;
    }

    if (subError) {
      console.warn('Coupon application failed:', subError.message);
      throw subError;
    }

    // 2. Send Confirmation Email
    try {
      const { sendSubscriptionConfirmationEmail } = await import('@/lib/email');
      await sendSubscriptionConfirmationEmail(user.email!, user.raw_user_meta_data?.full_name || user.email!, plan.toUpperCase());
    } catch (e) {
      console.warn('Email confirmation failed', e);
    }

    return NextResponse.json({
      success: true,
      plan,
      message: `Coupon applied! You now have ${plan === 'elite' ? 'Campus Elite' : 'Pro Scholar'} access.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
