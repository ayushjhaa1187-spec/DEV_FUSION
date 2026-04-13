import { createSupabaseServer } from './supabase/server';

/**
 * Canonical action types that map to points inside the `update_reputation` DB function.
 * Defined in migration 014_gamification_overhaul.sql CASE block.
 */
export type ReputationAction =
  | 'post_doubt'       // 10 pts
  | 'post_answer'      // 15 pts
  | 'accept_answer'    // 25 pts
  | 'vote_up'          // 2 pts
  | 'daily_login'      // 5 pts
  | 'complete_test'    // dynamic via p_metadata.points, default 10
  | 'streak_bonus';    // 50 pts

/**
 * Award reputation by delegating entirely to the `update_reputation` SECURITY DEFINER
 * function, which handles idempotency, ledger insert, and profile update atomically.
 *
 * @param userId         - Target user UUID
 * @param action         - Reputation action key (must exist in DB CASE block)
 * @param entityId       - Optional reference entity UUID
 * @param metadata       - Optional extra metadata (e.g. { points: 20 } for complete_test)
 * @param idempotencyKey - Optional dedup key; if provided, duplicate calls are a no-op
 */
export async function addReputationEvent(
  userId: string,
  action: ReputationAction,
  entityId?: string,
  metadata?: Record<string, unknown>,
  idempotencyKey?: string,
) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase.rpc('update_reputation', {
    p_user_id:         userId,
    p_action:          action,
    p_entity_id:       entityId ?? null,
    p_metadata:        metadata ?? {},
    p_idempotency_key: idempotencyKey ?? null,
  });

  if (error) throw new Error(`Reputation award failed: ${error.message}`);
  return { success: true };
}
