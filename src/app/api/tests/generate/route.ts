import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generatePracticeQuiz } from '@/lib/ai-service';
import { enforcePlanLimit } from '@/lib/usage';

/**
 * /api/tests/generate
 * Generates an AI-backed practice quiz and stores it in the DB.
 */
export async function POST(req: NextRequest) {
  // 1. Auth Enforcement
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const { subject_id, topic } = await req.json();
    if (!subject_id || !topic) {
      return NextResponse.json({ success: false, error: 'Subject and Topic are required' }, { status: 400 });
    }

    // 2. Plan Check (Relaxed to 10/week for verification)
    const limit = await enforcePlanLimit(user.id, 'ai_test_generate', { free: 10, pro: 50, elite: null }, 'weekly');
    if (!limit.allowed) {
      return NextResponse.json({
        success: false,
        error: `Weekly quiz generation limit reached for ${limit.plan} plan.`,
      }, { status: 403 });
    }

    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .single();

    // 3. Centralized AI Call
    const result = await generatePracticeQuiz(subject?.name || 'General', topic);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'AI Engine failed to generate questions.' 
      }, { status: 500 });
    }

    const questions = result.data;

    // 4. Persistence
    // Create Test Header
    const { data: test, error: testError } = await supabase
      .from('practice_tests')
      .insert({
        creator_id: user.id,
        subject_id,
        topic,
        duration_minutes: 10
      })
      .select()
      .single();

    if (testError) throw testError;

    // Insert Questions
    const formattedQuestions = questions.map((q: any) => ({
      test_id: test.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation
    }));

    const { data: storedQuestions, error: questionError } = await supabase
      .from('practice_questions')
      .insert(formattedQuestions)
      .select();

    if (questionError) throw questionError;

    return NextResponse.json({
      success: true,
      data: {
        ...test,
        questions: storedQuestions,
        remaining: limit.remaining
      }
    });
  } catch (error: any) {
    console.error('[api/tests/generate] Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
