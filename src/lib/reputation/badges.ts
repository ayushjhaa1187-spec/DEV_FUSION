import { createSupabaseServer } from '@/lib/supabase/server';

export async function checkAndAwardBadges(userId: string) {
  const supabase = await createSupabaseServer();

  // 1. Fetch user's current stats and existing badges
  // 1. Fetch user data with individual handling to prevent catch-all failure
  const profileRes = await supabase.from('profiles').select('reputation_points, login_streak').eq('id', userId).maybeSingle();
  const badgesRes = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const allBadgesRes = await supabase.from('badges').select('*');

  const profile = profileRes.data;
  const existingBadges = badgesRes.data;
  const allBadges = allBadgesRes.data;

  if (!profile || !allBadges) return;

  const currentBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));
  const badgesToAward: string[] = [];

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue;

    let shouldAward = false;
    switch (badge.criteria_type) {
      case 'reputation':
        if (profile.reputation_points >= badge.criteria_value) shouldAward = true;
        break;
      case 'streak':
        if (profile.login_streak >= (badge.criteria_value || 0)) shouldAward = true;
        break;
    }

    if (shouldAward) badgesToAward.push(badge.id);
  }

  // 3. Award and Notify
  if (badgesToAward.length > 0) {
    const records = badgesToAward.map(badgeId => ({ user_id: userId, badge_id: badgeId }));
    await supabase.from('user_badges').upsert(records, { onConflict: 'user_id,badge_id' });
    
    for (const badgeId of badgesToAward) {
      const badge = allBadges.find(b => b.id === badgeId);
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        title: 'New Badge Unlocked!',
        message: `Congratulations! You've earned the ${badge?.name || 'Achievement'} badge.`,
        metadata: { badge_id: badgeId }
      }).catch(() => null); // Non-fatal
    }
  }
}
