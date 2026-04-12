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
  entityId?: string
) {
  const supabase = await createSupabaseServer();
  const pointsDelta = REPUTATION_POINTS[eventType];
  
  // award_points RPC handles the insert into reputation_events AND the update to profiles
  const { error } = await supabase.rpc('award_points', {
    u_id: userId,
    p_count: pointsDelta,
    e_type: eventType,
    ent_id: entityId,
    i_key: `${eventType}:${userId}:${entityId || Date.now()}`
  });

  if (error) throw error;

  // Still check for badges manually for now if the trigger isn't reliable
  const { data: profile } = await supabase
    .from('profiles')
    .select('reputation_points')
    .eq('id', userId)
    .single();

  const newScore = profile?.reputation_points || 0;
  await checkBadgeUnlocks(userId, newScore);
  
  return { success: true, pointsDelta, newScore };
}

async function checkBadgeUnlocks(userId: string, currentScore: number) {
  const supabase = await createSupabaseServer();
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .lte('requirement_points', currentScore);
  if (!badges) return;
  for (const badge of badges) {
    await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_id: badge.id }, { onConflict: 'user_id,badge_id' });
  }
}


