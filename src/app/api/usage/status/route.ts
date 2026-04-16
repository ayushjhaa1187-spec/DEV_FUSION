import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/usage";
import { PLAN_DETAILS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const plan = await getUserPlan(user.id) as any;
    const limits = PLAN_DETAILS[plan as 'free' | 'pro' | 'elite'] || PLAN_DETAILS.free;

    // Fetch all usage counts for today
    const { data: usageLogs } = await supabase
      .from('usage_daily_log')
      .select('action, count')
      .eq('user_id', user.id)
      .eq('date', today);

    const counts: Record<string, number> = {};
    usageLogs?.forEach(log => {
      counts[log.action] = log.count;
    });

    // Fetch wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      plan: plan,
      usages: {
        doubt_solve: {
          used: counts['ai_doubt_solve'] ?? 0,
          total: limits.aiDaily
        },
        test_generate: {
          used: counts['ai_test_generate'] ?? 0,
          total: limits.testsWeekly // Note: Using testsWeekly limit here
        }
      },
      // Backward compatibility
      usage: {
        used: counts['ai_doubt_solve'] ?? 0,
        total: limits.aiDaily
      },
      wallet: {
        balance: wallet?.balance ?? 0
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
