import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

const COUPONS: Record<string, 'pro' | 'elite'> = {
  'JAHNAVI_LABS': 'elite',
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

    // Update or Insert subscription for the user
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan: plan,
      status: 'active',
      razorpay_subscription_id: `free_${cleanCode}_${Date.now()}`, // Placeholder ID
      razorpay_plan_id: `free_${plan}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year free
    }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      plan,
      message: `Coupon applied! You now have ${plan === 'elite' ? 'Campus Pro' : 'Pro Scholar'} access.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
