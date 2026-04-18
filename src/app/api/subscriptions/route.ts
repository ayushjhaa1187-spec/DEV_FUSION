import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { PLAN_DETAILS, type PlanTier } from '@/lib/plans';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';

/**
 * Utility to map plan IDs to SkillBridge plan tiers
 */
function getPlanFromPlanId(planId: string): PlanTier {
  if (planId.toLowerCase().includes('elite')) return 'elite';
  if (planId.toLowerCase().includes('pro')) return 'pro';
  return 'free';
}

/**
 * SkillBridge Subscription Management API
 * Handles plan retrieval, creation (via Razorpay), and cancellations.
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const plan = (data?.plan as PlanTier) || 'free';
  return NextResponse.json({ 
    success: true, 
    subscription: data, 
    planDetails: PLAN_DETAILS[plan], 
    nextBillingDate: data?.current_period_end || null 
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { plan, razorpay_subscription_id, razorpay_plan_id, razorpay_order_id, razorpay_payment_id } = body;

    // Calculate end date (default 1 month)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Upsert subscription into database
    let { data: sub, error: dbError } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan: plan || getPlanFromPlanId(razorpay_plan_id || ''),
      status: 'active',
      razorpay_subscription_id,
      razorpay_plan_id,
      razorpay_order_id,
      razorpay_payment_id,
      current_period_start: new Date().toISOString(),
      current_period_end: endDate.toISOString(),
    }, { onConflict: 'user_id' }).select().single();

    // Fallback if schema is missing Razorpay columns
    if (dbError && (dbError.message.includes('razorpay_plan_id') || dbError.message.includes('current_period'))) {
      const { data: fallbackSub, error: fallbackError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: plan || getPlanFromPlanId(razorpay_plan_id || ''),
        status: 'active'
      }, { onConflict: 'user_id' }).select().single();
      
      sub = fallbackSub;
      dbError = fallbackError;
    }

    if (dbError) throw dbError;

    // Trigger Success Email (Priority 3)
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
      const targetEmail = profile?.email || user.email; // Priority: profile sync > auth user primary
      const targetName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Scholar';

      const { sendSubscriptionConfirmationEmail } = await import('@/lib/email');
      
      if (targetEmail) {
        await sendSubscriptionConfirmationEmail({
          email: targetEmail,
          name: targetName,
          plan: plan || getPlanFromPlanId(razorpay_plan_id || ''),
          amount: plan === 'elite' ? 499 : 149, // Approx values based on PlanTier
          nextBillingDate: endDate.toISOString(),
          invoiceId: razorpay_payment_id || `INV-${Date.now()}`
        });
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
    }

    return NextResponse.json({ success: true, data: sub });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data: active } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'authenticated', 'created'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active?.razorpay_subscription_id) {
    return NextResponse.json({ success: false, error: 'No active subscription found' }, { status: 404 });
  }

  try {
    try {
      await getRazorpayClient().subscriptions.cancel(active.razorpay_subscription_id, false);
    } catch (err) {
      console.warn("Razorpay cancellation warning:", err);
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled', 
        cancelled_at: new Date().toISOString()
      })
      .eq('id', active.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
