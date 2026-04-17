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

    // Fallback logic for schema mismatches
    if (firstErr) {
      console.warn('Coupon primary upsert failed, attempting fallback...', firstErr.message);
      
      const fallbackData: any = {
        user_id: user.id,
        plan,
      };

      // Only add columns if they weren't the cause of the previous failure
      if (!firstErr.message.includes('status')) {
        fallbackData.status = 'active';
      }
      
      if (!firstErr.message.includes('razorpay_subscription_id')) {
        fallbackData.razorpay_subscription_id = `coupon_${cleanCode}_${Date.now()}`;
      }

      const { error: fallbackErr } = await supabase.from('subscriptions').upsert(fallbackData, { onConflict: 'user_id' });

      if (fallbackErr) throw fallbackErr;
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
