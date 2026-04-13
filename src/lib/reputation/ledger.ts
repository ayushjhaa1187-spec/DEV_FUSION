import { createAdminClient } from '../supabase/admin';

/**
 * Reputation actions supported by the `update_reputation` DB function.
 * Defined in migration 014_gamification_overhaul.sql.
 */
export type ReputationAction =
  | 'post_doubt'
  | 'post_answer'
  | 'accept_answer'
  | 'vote_up'
  | 'daily_login'
  | 'complete_test'
  | 'streak_bonus';

/**
 * Award reputation points using the admin (service-role) client.
 * Delegates entirely to the `update_reputation` SECURITY DEFINER function —
 * no direct table inserts needed; the function handles ledger + profile update.
 *
 * Use this from server-side admin contexts (webhooks, cron jobs, etc.).
 * For user-context server routes, use `addReputationEvent` from reputation-service.ts.
 */
export async function awardReputation(
  userId: string,
  action: ReputationAction,
  referenceId?: string,
  metadata?: Record<string, unknown>,
): Promise<{ points: number }> {
  const admin = createAdminClient();

  const { error } = await admin.rpc('update_reputation', {
    p_user_id:         userId,
    p_action:          action,
    p_entity_id:       referenceId ?? null,
    p_metadata:        metadata ?? {},
    p_idempotency_key: null,
  });

  if (error) throw new Error(`Reputation update failed: ${error.message}`);

  // Points lookup mirrors the DB CASE block (informational only — DB is authoritative)
  const POINTS_MAP: Record<ReputationAction, number> = {
    post_doubt:    10,
    post_answer:   15,
    accept_answer: 25,
    vote_up:       2,
    daily_login:   5,
    complete_test: (metadata?.points as number) || 10,
    streak_bonus:  50,
  };

  return { points: POINTS_MAP[action] };
}
