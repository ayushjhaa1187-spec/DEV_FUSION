/**
 * usage.ts — SkillBridge AI Credit Gate
 *
 * Centralised utility for checking and consuming AI credits.
 * Rules:
 *   - Free tier users pull from their credit_wallets balance.
 *   - Pro tier bypasses the wallet for standard actions (solve, test, study_plan).
 *   - Elite tier bypasses ALL actions including coaching_report.
 *   - Wallet deduction is atomic — done in a single Supabase RPC call to prevent
 *     race conditions on concurrent requests.
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── Action Cost Table ───────────────────────────────────────────────────────
export const AI_ACTION_COSTS = {
  ai_doubt_solve: 2,
  ai_test_generate: 5,
  ai_coaching_report: 8,   // charged even on Pro (premium feature)
  ai_study_plan: 15,
} as const;

export type AiAction = keyof typeof AI_ACTION_COSTS;

// ─── Plan Hierarchy ──────────────────────────────────────────────────────────
const PLAN_BYPASS: Record<string, AiAction[]> = {
  pro: ["ai_doubt_solve", "ai_test_generate", "ai_study_plan"],
  elite: ["ai_doubt_solve", "ai_test_generate", "ai_coaching_report", "ai_study_plan"],
  campus: ["ai_doubt_solve", "ai_test_generate", "ai_coaching_report", "ai_study_plan"],
  institutional: ["ai_doubt_solve", "ai_test_generate", "ai_coaching_report", "ai_study_plan"],
};

// ─── Result Types ─────────────────────────────────────────────────────────────
export type CreditCheckResult =
  | { allowed: true; deducted: number; remainingBalance: number | null }
  | { allowed: false; reason: "insufficient_credits" | "no_wallet" | "db_error"; balance: number };

// ─── Core Function ────────────────────────────────────────────────────────────
/**
 * Checks whether a user can perform an AI action and, if allowed,
 * atomically deducts the cost from their wallet.
 *
 * @param userId  - Supabase auth user ID
 * @param action  - The AI action being attempted
 * @param client  - Optional pre-created Supabase server client (for reuse)
 */
export async function consumeCredit(
  userId: string,
  action: AiAction,
  client?: SupabaseClient
): Promise<CreditCheckResult> {
  const supabase = client ?? await createSupabaseServer();
  const cost = AI_ACTION_COSTS[action];

  // 1. Fetch the user's active subscription plan
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = sub?.plan ?? "free";

  // 2. Check if this plan bypasses the credit requirement for this action
  const bypassActions = PLAN_BYPASS[plan] ?? [];
  if (bypassActions.includes(action)) {
    return { allowed: true, deducted: 0, remainingBalance: null };
  }

  // 3. Atomically deduct credits via DB function (prevents race conditions)
  const { data, error } = await supabase.rpc("consume_ai_credit", {
    p_user_id: userId,
    p_action: action,
  });

  if (error) {
    console.error("[usage] consume_ai_credit RPC error:", error.message);
    return { allowed: false, reason: "db_error", balance: 0 };
  }

  // The RPC returns { success: boolean, new_balance: number }
  const result = data as { success: boolean; new_balance: number };

  if (!result.success) {
    return {
      allowed: false,
      reason: "insufficient_credits",
      balance: result.new_balance,
    };
  }

  return {
    allowed: true,
    deducted: cost,
    remainingBalance: result.new_balance,
  };
}

// ─── Balance Query (no deduction) ────────────────────────────────────────────
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.balance ?? 0;
}

// ─── Daily free-tier limit check (non-wallet gating) ─────────────────────────
// Free users get N free solves/day BEFORE touching their wallet. This is
// tracked via a simple counter in the `usage_daily_log` table.
export async function checkDailyFreeLimit(
  userId: string,
  action: AiAction,
  dailyMax: number
): Promise<{ withinLimit: boolean; usedToday: number }> {
  const supabase = await createSupabaseServer();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data } = await supabase
    .from("usage_daily_log")
    .select("count")
    .eq("user_id", userId)
    .eq("action", action)
    .eq("date", today)
    .maybeSingle();

  const usedToday = data?.count ?? 0;
  return { withinLimit: usedToday < dailyMax, usedToday };
}

export async function incrementDailyUsage(
  userId: string,
  action: AiAction
): Promise<void> {
  const supabase = await createSupabaseServer();
  const today = new Date().toISOString().slice(0, 10);

  await supabase.rpc("increment_daily_usage", {
    p_user_id: userId,
    p_action: action,
    p_date: today,
  });
}


// Backward-compatible helper used by existing quiz routes
export async function checkAndIncrementUsage(userId: string, _bucket: string): Promise<{ allowed: boolean; remaining: number }> {
  const DAILY_LIMIT = 10;
  const { withinLimit, usedToday } = await checkDailyFreeLimit(userId, 'ai_test_generate', DAILY_LIMIT);
  if (!withinLimit) {
    return { allowed: false, remaining: 0 };
  }

  await incrementDailyUsage(userId, 'ai_test_generate');
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - usedToday - 1) };
}


export async function getUserPlan(userId: string): Promise<string> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .in('status', ['active', 'authenticated'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.plan ?? 'free';
}

export async function enforcePlanLimit(
  userId: string,
  action: 'ai_doubt_solve' | 'ai_test_generate',
  limits: { free: number; pro: number; elite: number | null },
  period: 'daily' | 'weekly'
): Promise<{ allowed: boolean; remaining: number | null; plan: string }> {
  const supabase = await createSupabaseServer();
  const plan = await getUserPlan(userId);

  const planLimit = plan === 'elite' ? limits.elite : plan === 'pro' ? limits.pro : limits.free;
  if (planLimit === null) {
    return { allowed: true, remaining: null, plan };
  }

  const now = new Date();
  const periodStart = period === 'weekly'
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { count } = await supabase
    .from('rate_limit_windows')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('window_start', periodStart.toISOString());

  const used = count ?? 0;
  if (used >= planLimit) {
    return { allowed: false, remaining: 0, plan };
  }

  await supabase.from('rate_limit_windows').insert({
    user_id: userId,
    action,
    window_start: now.toISOString(),
    request_count: 1,
  });

  return { allowed: true, remaining: Math.max(0, planLimit - used - 1), plan };
}
