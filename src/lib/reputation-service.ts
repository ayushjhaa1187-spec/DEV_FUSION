import { createSupabaseServer } from './supabase/server';

export type ReputationEventType = 
  | 'answer_posted' 
  | 'answer_accepted' 
  | 'upvote_received' 
  | 'downvote_received' 
  | 'test_completed' 
  | 'ai_resolution' 
  | 'mentor_session_completed';

const REPUTATION_POINTS: Record<ReputationEventType, number> = {
  answer_posted: 10,
  answer_accepted: 25,
  upvote_received: 5,
  downvote_received: -2,
  test_completed: 15,
  ai_resolution: 5,
  mentor_session_completed: 20,
};

export async function addReputationEvent(
  userId: string, 
  eventType: ReputationEventType, 
  entityType?: string, 
  entityId?: string, 
  metadata: any = {}
) {
  const supabase = await createSupabaseServer();
  const pointsDelta = REPUTATION_POINTS[eventType];
  const { error: ledgerError } = await supabase
    .from('reputation_ledger')
    .insert({
      user_id: userId,
      event_type: eventType,
      points_delta: pointsDelta,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
  if (ledgerError) throw ledgerError;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('reputation_score')
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;
  const newScore = (profile.reputation_score || 0) + pointsDelta;
  await supabase
    .from('profiles')
    .update({ reputation_score: newScore })
    .eq('id', userId);
  await checkBadgeUnlocks(userId, newScore);
  return { success: true, pointsDelta, newScore };
}

async function checkBadgeUnlocks(userId: string, currentScore: number) {
  const supabase = await createSupabaseServer();
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .eq('requirement_type', 'reputation')
    .lte('requirement_value', currentScore);
  if (!badges) return;
  for (const badge of badges) {
    await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_id: badge.id }, { onConflict: 'user_id,badge_id' });
  }
}

// --- Query helpers (formerly in reputation.ts) ---
export const REPUTATION_WEIGHTS: Record<string, number> = {
  question_posted: 5,
  answer_posted: 10,
  answer_accepted: 50,
  upvote_received: 7,
  downvote_received: -3,
  badge_earned: 25,
  test_completed: 15,
  test_perfect_score: 30,
};

export const ALL_BADGES = [
  { id: 'rising-star', name: 'Rising Star', icon: '✨', description: 'Begin your journey as a recognized contributor.', requirement_points: 100 },
  { id: 'problem-solver', name: 'Problem Solver', icon: '🛠️', description: 'Help others by providing verified solutions.', requirement_points: 500 },
  { id: 'knowledge-guru', name: 'Knowledge Guru', icon: '🧠', description: 'Become a pillar of the learning community.', requirement_points: 1000 },
  { id: 'legend', name: 'Legend', icon: '👑', description: 'Reach the pinnacle of academic mastery.', requirement_points: 5000 },
];

export function getRank(points: number) {
  if (points >= 5000) return 'Legend';
  if (points >= 1000) return 'Knowledge Guru';
  if (points >= 500) return 'Problem Solver';
  if (points >= 100) return 'Rising Star';
  return 'Beginner';
}

export function getUnlockedBadges(points: number) {
  return ALL_BADGES.filter(b => points >= b.requirement_points);
}
