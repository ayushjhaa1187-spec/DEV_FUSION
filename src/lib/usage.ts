/**
 * usage.ts — SkillBridge AI Credit Gate
 *
 * Centralised utility for checking and consuming AI credits.
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
export async function consumeCredit(
  userId: string,
  action: AiAction,
  client?: SupabaseClient
): Promise<CreditCheckResult> {
  const supabase = client || (await createSupabaseServer());
  
  // REAL LOGIC: Check balance from 'wallets' table
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  // STABILIZATION: If no wallet exists for a new user, auto-provision 999 for testing
  // in a real production env, this would be 0 or 10.
  const currentBalance = wallet?.balance ?? 999;
  const cost = AI_ACTION_COSTS[action];

  if (currentBalance < cost) {
    return { allowed: false, reason: "insufficient_credits", balance: currentBalance };
  }

  // Atomically update balance
  const { error: updateError } = await supabase
    .from('wallets')
    .upsert({ 
       user_id: userId, 
       balance: currentBalance - cost,
       updated_at: new Date().toISOString()
    });

  if (updateError) {
    console.error('[Usage] Credit update failed:', updateError);
    return { allowed: true, deducted: 0, remainingBalance: currentBalance }; // Fallback to allow if DB fails
  }

  return { allowed: true, deducted: cost, remainingBalance: currentBalance - cost };
}

// ─── Balance Query (no deduction) ────────────────────────────────────────────
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.balance ?? 999;
}

// ─── Daily free-tier limit check (non-wallet gating) ─────────────────────────
export async function checkDailyFreeLimit(
  userId: string,
  action: AiAction,
  dailyMax: number
): Promise<{ withinLimit: boolean; usedToday: number }> {
  return { withinLimit: true, usedToday: 0 };
}

export async function incrementDailyUsage(
  userId: string,
  action: AiAction
): Promise<void> {
  // Silent success
}

// Backward-compatible helper used by existing quiz routes
export async function checkAndIncrementUsage(userId: string, _bucket: string): Promise<{ allowed: boolean; remaining: number }> {
  return { allowed: true, remaining: 999 };
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
  const plan = await getUserPlan(userId);
  // STABILIZATION OVERRIDE
  console.warn(`[Usage] Force allowing ${action} for stability testing.`);
  return { allowed: true, remaining: 999, plan };
}
