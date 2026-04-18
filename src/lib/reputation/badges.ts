import { createSupabaseServer } from '@/lib/supabase/server';

export async function checkAndAwardBadges(userId: string) {
  const supabase = await createSupabaseServer();

  // 1. Fetch user data and existing badges
  const [profileRes, badgesRes, allBadgesRes] = await Promise.all([
    supabase.from('profiles').select('reputation_points, login_streak').eq('id', userId).maybeSingle(),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    supabase.from('badges').select('*')
  ]);

  const profile = profileRes.data;
  const existingBadges = badgesRes.data;
  const allBadges = allBadgesRes.data;

  if (!profile || !allBadges) return;

  const currentBadgeIds = new Set((existingBadges || []).map(b => b.badge_id));
  const badgesToAward: string[] = [];

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue;

    let shouldAward = false;
    const { criteria_type, criteria_value } = badge;

    switch (criteria_type) {
      case 'reputation':
        if (profile.reputation_points >= (criteria_value || 0)) shouldAward = true;
        break;
      case 'streak':
        if (profile.login_streak >= (criteria_value || 0)) shouldAward = true;
        break;
      case 'answers_count':
        const { count: ansCount } = await supabase
          .from('answers')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId);
        if ((ansCount || 0) >= (criteria_value || 0)) shouldAward = true;
        break;
      case 'mentor_rating':
        const { data: mProfile } = await supabase
          .from('mentor_profiles')
          .select('rating, sessions_completed')
          .eq('id', userId)
          .maybeSingle();
        if (mProfile && mProfile.rating >= 4.5 && mProfile.sessions_completed >= (criteria_value || 0)) shouldAward = true;
        break;
      case 'subject_mastery':
        const { data: attempts } = await supabase
          .from('test_attempts')
          .select('test_id, score, global_tests:test_id(subject)')
          .eq('user_id', userId)
          .gte('score', 90);
        
        // Defensive mapping for nested join data
        const masterySubjects = new Set(
          (attempts || []).map(a => {
            const test = (a as any).global_tests;
            return test?.subject;
          }).filter(Boolean)
        );
        if (masterySubjects.size >= (criteria_value || 0)) shouldAward = true;
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
        link: '/profile'
      }).catch(() => null); 
    }
  }
}
