import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { attempt_id, answers, is_auto_submit } = await req.json();

    if (!attempt_id || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Verify the attempt belongs to this user and isn't already completed
    const { data: attempt, error: attemptFetchError } = await supabase
      .from('test_attempts')
      .select('id, status, test_id')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptFetchError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found or permission denied' }, { status: 404 });
    }

    if (attempt.status === 'COMPLETED' || attempt.status === 'AUTO_SUBMITTED') {
      return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });
    }

    // 2. Fetch the true correct_index for all questions in this test bank
    const { data: correctRefs, error: fetchKeysError } = await supabase
      .from('global_test_questions')
      .select('id, correct_index')
      .eq('test_id', attempt.test_id);

    if (fetchKeysError || !correctRefs) {
      console.error('[POST /api/tests/submit] Error fetching correct indices.', fetchKeysError);
      return NextResponse.json({ error: 'DB Error finding correct answers' }, { status: 500 });
    }

    // Prepare a map for fast lookup
    const correctMap = new Map(correctRefs.map(q => [q.id, q.correct_index]));

    // 3. Evaluate answers
    let score = 0;
    const answerInserts = [];

    for (const ans of answers) {
      const { question_id, selected_index } = ans;
      
      const trueCorrect = correctMap.get(question_id);
      
      // Treat undefined or out-of-range conceptually as wrong, but safe check:
      if (trueCorrect !== undefined) {
          const isCorrect = (selected_index === trueCorrect);
          if (isCorrect) score++;

          answerInserts.push({
            attempt_id,
            question_id,
            selected_index: typeof selected_index === 'number' ? selected_index : null,
            is_correct: isCorrect
          });
      }
    }

    // 4. Save User Answers
    if (answerInserts.length > 0) {
      const { error: insertAnswersError } = await supabase
        .from('test_attempt_answers')
        .insert(answerInserts);

      if (insertAnswersError) {
        console.error('[POST /api/tests/submit] Failed inserting answers:', insertAnswersError);
        // We continue to at least record the score
      }
    }

    // 5. Update Attempt to Completed
    const finalStatus = is_auto_submit ? 'AUTO_SUBMITTED' : 'COMPLETED';
    const { error: updateAttemptError } = await supabase
      .from('test_attempts')
      .update({
        score,
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', attempt_id);

    if (updateAttemptError) {
      console.error('[POST /api/tests/submit] Failed updating attempt status:', updateAttemptError);
      return NextResponse.json({ error: 'Failed saving final state' }, { status: 500 });
    }

    // 6. Return standard structured result
    // Provide the correctMap back to the frontend so it can render the green/red overlay correctly
    return NextResponse.json({
      success: true,
      score,
      total_questions: correctRefs.length,
      correct_answers: Object.fromEntries(correctMap)
    });

  } catch (error: any) {
    console.error('[POST /api/tests/submit] Server Error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
