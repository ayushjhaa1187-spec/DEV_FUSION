import { createSupabaseServer } from '@/lib/supabase/server';

export type RateLimitedAction = 'ai_chat' | 'ai_generate_test' | 'ai_explain' | 'doubt_post';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // sliding window in milliseconds
}

const RATE_LIMIT_CONFIG: Record<RateLimitedAction, RateLimitConfig> = {
  ai_chat:          { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  ai_generate_test: { maxRequests: 5,  windowMs: 60 * 60 * 1000 },
  ai_explain:       { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  doubt_post:       { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding-window rate limiter backed by Supabase `rate_limit_windows` table.
 *
 * Strategy:
 *  1. Delete all expired rows for (user_id, action) outside the 60-min window.
 *  2. Count remaining rows — each row represents one request.
 *  3. If count < limit, insert a new row and allow; otherwise deny.
 *
 * The `window_start` column stores the timestamp of each individual request,
 * and we keep only rows from the last 60 minutes, giving us a true sliding window.
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitedAction
): Promise<RateLimitResult> {
  const supabase = await createSupabaseServer();
  const config = RATE_LIMIT_CONFIG[action];
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // 1. Remove expired request records outside the sliding window
  await supabase
    .from('rate_limit_windows')
    .delete()
    .eq('user_id', userId)
    .eq('action', action)
    .lt('window_start', windowStart.toISOString());

  // 2. Count requests still within the window
  const { count, error: countError } = await supabase
    .from('rate_limit_windows')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString());

  if (countError) {
    // Fail open on DB errors to avoid breaking the user flow
    console.error('[rate-limiter] count error:', countError.message);
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(now.getTime() + config.windowMs) };
  }

  const currentCount = count ?? 0;
  const remaining = Math.max(0, config.maxRequests - currentCount - 1);

  // 3. Deny if limit reached
  if (currentCount >= config.maxRequests) {
    // Estimate resetAt: oldest row in window + windowMs
    const { data: oldest } = await supabase
      .from('rate_limit_windows')
      .select('window_start')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: true })
      .limit(1)
      .single();

    const resetAt = oldest
      ? new Date(new Date(oldest.window_start).getTime() + config.windowMs)
      : new Date(now.getTime() + config.windowMs);

    return { allowed: false, remaining: 0, resetAt };
  }

  // 4. Record this request
  const { error: insertError } = await supabase
    .from('rate_limit_windows')
    .insert({
      user_id: userId,
      action,
      window_start: now.toISOString(),
      request_count: 1,
    });

  if (insertError) {
    console.error('[rate-limiter] insert error:', insertError.message);
  }

  return {
    allowed: true,
    remaining,
    resetAt: new Date(now.getTime() + config.windowMs),
  };
}
