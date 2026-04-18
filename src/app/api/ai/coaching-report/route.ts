import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getModel, FALLBACK_MODEL } from '@/lib/ai-service';
import { consumeCredit } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Credit Gate
  const credit = await consumeCredit(user.id, 'ai_coaching_report', supabase);
  if (!credit.allowed) {
    return NextResponse.json({ 
        error: 'insufficient_credits', 
        message: 'This premium feature requires 8 AI credits or an Elite plan.' 
    }, { status: 402 });
  }

  try {
    // 2. Fetch Recent Performance Data
    const { data: submissions, error: subError } = await supabase
      .from('test_attempts')
      .select(`
        score,
        started_at,
        global_tests (
          topic,
          subject
        )
      `)
      .eq('user_id', user.id)
      .not('score', 'is', null)
      .order('started_at', { ascending: false })
      .limit(10);

    if (subError) throw subError;

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ 
          error: 'no_data', 
          message: 'Take a few practice tests first so I can analyze your performance!' 
      });
    }

    // 3. Prepare AI Prompt
    const performanceSnapshot = submissions.map(s => ({
      topic: s.global_tests?.topic,
      subject: s.global_tests?.subject,
      score: `${s.score}/100`,
      percentage: s.score
    }));

    const prompt = `You are the SkillBridge Lead AI Coach. 
Analyze the following student performance data from recent practice tests:
${JSON.stringify(performanceSnapshot, null, 2)}

Your Goal: Generate a comprehensive "Elite Coaching Report".
Structure:
1. Executive Summary: Overreaching performance trend.
2. Strengths: What topics are they mastering?
3. Critical Gaps: Which topics/concepts are dragging their score down?
4. Tactical Plan: Exactly what should they study in the next 48 hours?
5. Momentum Score: A creative rating (e.g., "Rising Phoenix", "Steady Scholar", "Critical Inertia") with explanation.

Return ONLY valid JSON in this format:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "plan": ["...", "..."],
  "momentum": { "label": "...", "description": "..." }
}`;

    // 4. Generate Report
    const model = getModel();
    let result;
    try {
        result = await model.generateContent(prompt);
    } catch (err) {
        const fallback = getModel(FALLBACK_MODEL);
        result = await fallback.generateContent(prompt);
    }
    
    const text = result.response.text();
    // Use a simpler JSON extraction since we need high reliability
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const report = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!report) throw new Error('AI failed to generate a valid report');

    return NextResponse.json({ success: true, report });

  } catch (err: any) {
    console.error('[ai/coaching-report] Error:', err);
    return NextResponse.json({ 
        error: 'processing_failed', 
        message: err.message || 'The AI coach is currently unavailable.' 
    }, { status: 500 });
  }
}
