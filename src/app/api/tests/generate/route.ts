import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generatePracticeQuiz } from '@/lib/ai-service';
import { checkRateLimit } from '@/lib/ai-service';
import { checkAndIncrementUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit check
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.', retryAfterMs: rateCheck.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const { subject_id, topic } = await req.json();
    if (!subject_id || !topic) {
      return NextResponse.json({ error: 'Subject and Topic are required' }, { status: 400 });
    }
    // Check usage limits
    const { allowed, remaining } = await checkAndIncrementUsage(user.id, 'question');
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Free tier limit reached (10 questions/day). Upgrade to Pro for unlimited access!',
        limitReached: true 
      }, { status: 403 });
    }
    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .single();
    const questions = await generatePracticeQuiz(subject?.name || 'General', topic);
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
    }
    // 1. Store Test
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
    if (testError) return NextResponse.json({ error: testError.message }, { status: 500 });
    // 2. Store Questions
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
    if (questionError) return NextResponse.json({ error: questionError.message }, { status: 500 });
    return NextResponse.json({ ...test, questions: storedQuestions, remaining });
  } catch (error) {
    console.error('Test Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
