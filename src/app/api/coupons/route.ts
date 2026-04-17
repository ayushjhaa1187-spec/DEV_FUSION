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

    // First attempt: upsert with all columns
    const { error: firstErr } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan,
      status: 'active',
      razorpay_subscription_id: `coupon_${cleanCode}_${Date.now()}`,
      razorpay_plan_id: `coupon_${plan}`,
      current_period_start: now,
      current_period_end: oneYearLater,
    }, { onConflict: 'user_id' });

    // Second attempt: fallback without period columns if schema mismatch
    if (firstErr && firstErr.message.includes('current_period')) {
      const { error: fallbackErr } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan,
        status: 'active',
        razorpay_subscription_id: `coupon_${cleanCode}_${Date.now()}`,
        razorpay_plan_id: `coupon_${plan}`,
      }, { onConflict: 'user_id' });

      if (fallbackErr) throw fallbackErr;
    } else if (firstErr) {
      throw firstErr;
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
