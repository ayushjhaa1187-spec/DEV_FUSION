import { NextRequest, NextResponse } from 'next/server';
import { askAIDoubt } from '@/lib/ai-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndIncrementUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sliding-window rate limit check (30 requests / hour)
  const rateCheck = await checkRateLimit(user.id, 'ai_chat');
  if (!rateCheck.allowed) {
    const retryAfterSecs = Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Try again later.',
        resetAt: rateCheck.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSecs) },
      }
    );
  }

  try {
    const { question, context } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Check usage limits (Questions)
    const { allowed, remaining } = await checkAndIncrementUsage(user.id, 'question');
    if (!allowed) {
      return NextResponse.json({ 
        error: `Free tier daily limit reached (100 questions/day). Upgrade to Pro for unlimited access!`,
        limitReached: true 
      }, { status: 403 });
    }

    const aiResponse = await askAIDoubt(question, context);
    return NextResponse.json({
      explanation: aiResponse.explanation,
      steps: aiResponse.steps,
      suggested_tags: aiResponse.suggested_tags,
      remaining,
      rateLimitRemaining: rateCheck.remaining,
    });
  } catch (error: any) {
    console.error(' [AI Solve API Error]:', {
      message: error.message,
      stack: error.stack,
      user: user?.id
    });
    
    // Check for common DB errors to provide more specific feedback
    if (error.message?.includes('rate_limit_windows') || error.message?.includes('user_usage')) {
      return NextResponse.json({ 
        error: 'Database table missing. Please apply Migration 004 to your Supabase project.' 
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
