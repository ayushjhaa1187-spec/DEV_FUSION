import { createSupabaseServer } from '@/lib/supabase/server';

export async function checkAndAwardBadges(userId: string) {
  const supabase = await createSupabaseServer();

  // 1. Fetch user's current stats and existing badges
  const [
    { data: profile },
    { data: existingBadges },
    { data: stats }
  ] = await Promise.all([
    supabase.from('profiles').select('reputation_points, login_streak').eq('id', userId).single(),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    supabase.from('profiles').select('id') // Placeholder for more complex stats if needed
  ]);

  if (!profile) return;

  const currentBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));

  // 2. Fetch all available badges
  const { data: allBadges } = await supabase.from('badges').select('*');
  if (!allBadges) return;

  const badgesToAward: string[] = [];

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.criteria_type) {
      case 'reputation':
        if (profile.reputation_points >= badge.criteria_value) shouldAward = true;
        break;
      case 'streak':
        if (profile.login_streak >= badge.criteria_value) shouldAward = true;
        break;
      // Add more cases as system matures (e.g. tests_passed, doubts_resolved)
    }

    if (shouldAward) {
      badgesToAward.push(badge.id);
    }
  }

  // 3. Persist new badges
  if (badgesToAward.length > 0) {
    const records = badgesToAward.map(badgeId => ({
      user_id: userId,
      badge_id: badgeId
    }));

    await supabase.from('user_badges').upsert(records, { onConflict: 'user_id,badge_id' });
    
    // Optional: Send notification for each new badge
    for (const badgeId of badgesToAward) {
      const badge = allBadges.find(b => b.id === badgeId);
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        title: 'New Badge Unlocked!',
        message: `Congratulations! You've earned the ${badge?.name} badge.`,
        metadata: { badge_id: badgeId }
      });
    }
  }
}
