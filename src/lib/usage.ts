import { createSupabaseServer } from './supabase/server';

export type UsageType = 'interview' | 'question';

const LIMITS = {
  free: {
    interview: 5, // per month
    question: 10, // per day
  },
  pro: {
    interview: Infinity,
    question: Infinity,
  }
};

export async function checkAndIncrementUsage(userId: string, type: UsageType): Promise<{ allowed: boolean; remaining: number | string }> {
  const supabase = await createSupabaseServer();
  
  // 1. Get user tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();
  
  const tier = (profile?.subscription_tier || 'free') as 'free' | 'pro';
  
  if (tier === 'pro') {
    return { allowed: true, remaining: 'Unlimited' };
  }

  // 2. Get usage
  const { data: usage, error: usageError } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "not found"
    throw usageError;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM

// If no row exists yet, insert a fresh default row first
  if (!usage) {
    const defaultUsage = {
      user_id: userId,
      interviews_this_month: 0,
      questions_today: 0,
      last_reset_interviews: today,
      last_reset_questions: today
    };
    const { error: insertError } = await supabase
      .from('user_usage')
      .insert(defaultUsage);
    if (insertError) throw insertError;
  }
    let currentUsage = usage || {
    user_id: userId,
    interviews_this_month: 0,
    questions_today: 0,
    last_reset_interviews: today,
    last_reset_questions: today
  };

  // Reset logic
  if (currentUsage.last_reset_questions !== today) {
    currentUsage.questions_today = 0;
    currentUsage.last_reset_questions = today;
  }

  if (currentUsage.last_reset_interviews.substring(0, 7) !== thisMonth) {
    currentUsage.interviews_this_month = 0;
    currentUsage.last_reset_interviews = today;
  }

  // Check limits
  const limit = LIMITS.free[type];
  const currentCount = type === 'interview' ? currentUsage.interviews_this_month : currentUsage.questions_today;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment usage
  if (type === 'interview') {
    currentUsage.interviews_this_month += 1;
  } else {
    currentUsage.questions_today += 1;
  }

  const { error: updateError } = await supabase
    .from('user_usage')
    .upsert(currentUsage, { onConflict: 'user_id' });

  if (updateError) throw updateError;

  return { allowed: true, remaining: limit - (currentCount + 1) };
}
