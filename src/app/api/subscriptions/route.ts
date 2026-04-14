import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';

const PLAN_META: Record<string, { name: string; amount: number }> = {
  free: { name: 'Free', amount: 0 },
  pro: { name: 'Pro', amount: 14900 },
  elite: { name: 'Elite', amount: 34900 },
};

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const plan = data?.plan || data?.plan_id || 'free';
  return NextResponse.json({
    subscription: data,
    plan,
    planDetails: PLAN_META[plan] ?? PLAN_META.free,
    nextBillingDate: data?.current_end || null,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { plan_id, plan = 'pro' } = await req.json();

    if (!plan_id) return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 });

    const subscription = await getRazorpayClient().subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 120,
      notes: { user_id: user.id, plan },
    });

    const { error: upsertError } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        plan_id,
        plan,
        status: subscription.status,
      },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment service error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.razorpay_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
  }

  try {
    await getRazorpayClient().subscriptions.cancel(sub.razorpay_subscription_id);
  } catch {
    // keep local cancel even if provider request fails in sandbox/dev
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', current_end: new Date().toISOString() })
    .eq('id', sub.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (process.env.RAZORPAY_WEBHOOK_SECRET && secret !== process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  const { subscriptionId } = await req.json().catch(() => ({ subscriptionId: undefined }));
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('razorpay_subscription_id', subscriptionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
