import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { PLAN_DETAILS, type PlanTier } from '@/lib/plans';

function getPlanFromPlanId(planId: string): PlanTier {
  if (planId.toLowerCase().includes('elite')) return 'elite';
  if (planId.toLowerCase().includes('pro')) return 'pro';
  return 'free';
}

async function getCurrentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  const plan = (data?.plan as PlanTier) || 'free';
  return NextResponse.json({ success: true, subscription: data, planDetails: PLAN_DETAILS[plan], nextBillingDate: data?.current_period_end || null });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });

  try {
    const { plan_id } = await req.json();
    if (!plan_id) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing plan_id' } }, { status: 400 });
    }

    const subscription = await getRazorpayClient().subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 120,
      notes: { user_id: user.id },
    });

    const plan = getPlanFromPlanId(plan_id);
    const { error: dbError } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: plan_id,
      plan,
      status: subscription.status,
      current_period_start: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment service error';
    return NextResponse.json({ success: false, error: { code: 'SUBSCRIPTION_CREATE_FAILED', message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });

  const { data: active } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'authenticated', 'created'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active?.razorpay_subscription_id) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'No active subscription found' } }, { status: 404 });
  }

  try {
    await getRazorpayClient().subscriptions.cancel(active.razorpay_subscription_id, false);

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), current_period_end: new Date().toISOString() })
      .eq('id', active.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json({ success: false, error: { code: 'SUBSCRIPTION_CANCEL_FAILED', message } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase } = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const subscriptionId = body?.subscription_id as string | undefined;

  if (!subscriptionId) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'subscription_id is required' } }, { status: 400 });
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('razorpay_subscription_id', subscriptionId);

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
