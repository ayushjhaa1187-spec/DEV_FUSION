import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getModel, FALLBACK_MODEL } from '@/lib/ai-service';
import { consumeCredit, getUserPlan } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Credit Gate
  const credit = await consumeCredit(user.id, 'ai_study_plan', supabase);
  if (!credit.allowed) {
    return NextResponse.json({ 
        error: 'insufficient_credits', 
        message: 'Personalised study plans require 15 AI credits or an Elite plan.' 
    }, { status: 402 });
  }

  try {
    // 2. Data Gathering
    const { data: profile } = await supabase
      .from('profiles')
      .select('college, branch, semester, login_streak')
      .eq('id', user.id)
      .single();

    const { data: submissions } = await supabase
      .from('test_attempts')
      .select('score, global_tests(topic)')
      .eq('user_id', user.id)
      .not('score', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    const weakTopics = Array.from(new Set(
        submissions?.filter(s => (s.score || 0) < 70).map(s => s.global_tests?.topic as string) || []
    )).slice(0, 10);

    // 3. Prompt Construction
    const prompt = `You are a professional academic counselor at SkillBridge.
Generate a High-Performance 7-Day Study Plan for a student with the following profile:
- Branch/Course: ${profile?.branch || 'General'}
- Semester: ${profile?.semester || 'N/A'}
- Recent Weak Areas: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified yet (focus on core subjects)'}
- Study Momentum (Streak): ${profile?.login_streak || 0} days

The plan should be:
- Ambitious but achievable.
- Specific about what to read/practice each day.
- Include "Rest/Review" on Day 7.

Return strictly as a JSON object:
{
  "title": "...",
  "objective": "...",
  "schedule": [
    { "day": 1, "topic": "...", "tasks": ["...", "..."], "duration": "90 mins" },
    ... up to day 7
  ],
  "coach_tip": "..."
}`;

    // 4. AIService Call
    const model = getModel();
    let result;
    try {
        result = await model.generateContent(prompt);
    } catch {
       const fallback = getModel(FALLBACK_MODEL);
       result = await fallback.generateContent(prompt);
    }
    
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!plan) throw new Error('Failed to generate valid study plan');

    return NextResponse.json({ success: true, plan });

  } catch (err: any) {
    console.error('[ai/study-plan] Error:', err);
    return NextResponse.json({ 
        error: 'processing_failed', 
        message: 'The academic counselor is busy. Please try again in a moment.' 
    }, { status: 500 });
  }
}
