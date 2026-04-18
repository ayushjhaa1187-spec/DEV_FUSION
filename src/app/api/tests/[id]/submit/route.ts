import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { extractConceptScores, updateReviewQueue } from '@/lib/review-queue';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { attemptId } = await req.json();
    const final_attempt_id = attemptId || id;

    // 1. Fetch the attempt to verify it belongs to the user and is still active
    const { data: attempt, error: attemptErr } = await supabase
      .from('test_attempts')
      .select('*, global_tests(id)')
      .eq('id', final_attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    // 2. Aggregate results from test_attempt_answers
    const { data: answers, error: answerErr } = await supabase
      .from('test_attempt_answers')
      .select('question_id, selected_index, is_correct')
      .eq('attempt_id', final_attempt_id);

    if (answerErr) throw answerErr;

    const { data: questions } = await supabase
      .from('global_test_questions')
      .select('id')
      .eq('test_id', attempt.test_id);

    const total   = questions?.length || 0;
    const correct = answers?.filter((a: any) => a.is_correct).length || 0;
    const wrong   = (answers?.length || 0) - correct;
    const score   = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 3. Mark attempt as completed and persist score
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from('test_attempts')
      .update({
        score,
        status:            'COMPLETED',
        completed_at:      new Date().toISOString(),
      })
      .eq('id', final_attempt_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Award reputation via the consolidated RPC (idempotent)
    const pointsEarned = score === 100 ? 20 : score >= 80 ? 15 : 10;

    const { error: repError } = await supabase.rpc('update_reputation', {
      p_user_id:         user.id,
      p_action:          'complete_test',
      p_entity_id:       attempt.test_id,
      p_metadata:        { score, points: pointsEarned },
      p_idempotency_key: `test_submit:${updatedAttempt.id}`,
    });

    if (repError) {
      console.error('Reputation award error:', repError);
    }

    // 4b. Update review queue with weak concepts (score < 60%)
    try {
      // Note: extractConceptScores will need refactoring as well
      const conceptScores = await extractConceptScores(final_attempt_id, attempt.test_id);
      await updateReviewQueue(user.id, conceptScores);
    } catch (queueError) {
      console.error('Review queue update error:', queueError);
    }

    // 5. AI Pattern Detection (Phase 6 Polish)
    let aiInsight = null;
    try {
      if (score < 100) {
        const { data: missedQuestions } = await supabase
          .from('test_attempt_answers')
          .select('global_test_questions(question_text)')
          .eq('attempt_id', final_attempt_id)
          .eq('is_correct', false);

        if (missedQuestions && missedQuestions.length > 0) {
          aiInsight = {
            missedCount: missedQuestions.length,
            advice: `You missed ${missedQuestions.length} questions. Pattern analysis suggests reviewing the core concepts of this topic.`
          };
        }
      }
    } catch (e) {
      console.error('AI Insight Error:', e);
    }

    // 6. Check for badges (centralized engine)
    await checkAndAwardBadges(user.id);

    return NextResponse.json({
      score,
      correct,
      wrong,
      total,
      pointsEarned,
      aiInsight,
      ...(score === 100 ? { badge: 'Test Ace' } : {}),
    });
  } catch (error: any) {
    console.error('Test Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
