import { createAdminClient } from '../supabase/admin';

export type ReputationAction =
  | 'post_doubt'
  | 'answer_upvoted'
  | 'answer_accepted'
  | 'test_passed'
  | 'session_complete'
  | 'mentor_rated_5';

const POINTS_MAP: Record<ReputationAction, number> = {
  post_doubt: 5,
  answer_upvoted: 10,
  answer_accepted: 25,
  test_passed: 15,
  session_complete: 20,
  mentor_rated_5: 30,
};

export async function awardReputation(
  userId: string,
  action: ReputationAction,
  referenceId?: string
): Promise<{ points: number; newTotal: number; badgeUnlocked?: string }> {
  const admin = createAdminClient();
  const points = POINTS_MAP[action];

  // Append-only ledger insert
  const { error: ledgerError } = await admin
    .from('reputation_events')
    .insert({
      user_id: userId,
      points_delta: points,
      action_type: action,
      reference_id: referenceId ?? null,
    });

  if (ledgerError) throw new Error(`Ledger insert failed: ${ledgerError.message}`);

  // Atomic counter update via RPC
  const { error: updateError } = await admin.rpc('update_reputation', {
    p_user_id: userId,
    p_action: action,
    p_ref_id: referenceId ?? null,
  });

  if (updateError) throw new Error(`Reputation update failed: ${updateError.message}`);

  // Read updated profile for badge check
  const { data: profile } = await admin
    .from('users')
    .select('reputation_points, badge_level')
    .eq('id', userId)
    .single();

  const newTotal = (profile as { reputation_points: number; badge_level: string } | null)?.reputation_points ?? 0;
  const currentBadge = (profile as { reputation_points: number; badge_level: string } | null)?.badge_level;
  let badgeUnlocked: string | undefined;

  const badges = [
    { level: 'Newcomer', threshold: 0 },
    { level: 'Helper', threshold: 100 },
    { level: 'Expert', threshold: 500 },
    { level: 'Legend', threshold: 1500 },
  ];

  const newBadge = [...badges].reverse().find((b) => newTotal >= b.threshold);
  if (newBadge && newBadge.level !== currentBadge) {
    await admin
      .from('users')
      .update({ badge_level: newBadge.level })
      .eq('id', userId);
    badgeUnlocked = newBadge.level;
  }

  return { points, newTotal, badgeUnlocked };
}
