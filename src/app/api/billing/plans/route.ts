import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { PLAN_DETAILS, type PlanTier } from '@/lib/plans';

function getPlanFromPlanId(planId: string): PlanTier {
  const p = planId.toLowerCase();
  if (p.includes('elite')) return 'elite';
  if (p.includes('pro')) return 'pro';
  if (p.includes('campus')) return 'campus';
  return 'free';
}

/**
 * GET /api/billing/plans
 * Fetches current active subscription plan for the user.
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'authenticated', 'created'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const plan = (data?.plan as PlanTier) || 'free';
  return NextResponse.json({ 
    success: true, 
    plan,
    subscription: data, 
    details: PLAN_DETAILS[plan], 
    expiresAt: data?.current_period_end 
  });
}

/**
 * POST /api/billing/plans
 * Initiates a new subscription via Razorpay.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { plan_id } = await req.json();
    if (!plan_id) {
      return NextResponse.json({ success: false, error: 'Missing plan_id' }, { status: 400 });
    }

    // Create Razorpay Subscription
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 120, // 10 years for monthly
      notes: { user_id: user.id },
    });

    const plan = getPlanFromPlanId(plan_id);

    // Record pending subscription in DB
    const { error: dbError } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: plan_id,
      plan: plan,
      status: subscription.status,
      current_period_start: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, subscription_id: subscription.id });
  } catch (err: any) {
    console.error('[billing/plans] POST error:', err);
    return NextResponse.json({ 
        success: false, 
        error: err.message || 'Failed to initiate subscription' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/billing/plans
 * Cancels the current active subscription.
 */
export async function DELETE() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: active } = await supabase
      .from('subscriptions')
      .select('razorpay_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'authenticated', 'created'])
      .maybeSingle();

    if (!active?.razorpay_subscription_id) {
      return NextResponse.json({ success: false, error: 'No active subscription' }, { status: 404 });
    }

    // Cancel in Razorpay
    try {
      await getRazorpayClient().subscriptions.cancel(active.razorpay_subscription_id, false); // cancel at end of cycle
    } catch (err) {
      console.warn('[billing/plans] Razorpay cancel failed, updating locally only.');
    }

    // Update locally
    await supabase.from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
