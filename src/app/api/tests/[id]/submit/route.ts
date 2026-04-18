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
      .from('practice_attempts')
      .select('*, practice_tests(id)')
      .eq('id', final_attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'active') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    // 2. Aggregate results from practice_answers
    const { data: answers, error: answerErr } = await supabase
      .from('practice_answers')
      .select('question_id, selected_index, is_correct')
      .eq('attempt_id', final_attempt_id);

    if (answerErr) throw answerErr;

    // Build a snapshot for the legacy selected_answers JSONB column
    const answers_snapshot: Record<string, number> = {};
    answers?.forEach((a: any) => {
      if (a.selected_index !== null) answers_snapshot[a.question_id] = a.selected_index;
    });

    const { data: questions } = await supabase
      .from('practice_questions')
      .select('id')
      .eq('test_id', attempt.test_id);

    const total   = questions?.length || 0;
    const correct = answers?.filter((a: any) => a.is_correct).length || 0;
    const wrong   = (answers?.length || 0) - correct;
    const score   = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 3. Mark attempt as completed and persist score
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from('practice_attempts')
      .update({
        score,
        correct_count:     correct,
        wrong_count:       wrong,
        total_questions:   total,
        selected_answers:  answers_snapshot,
        status:            'completed',
        completed_at:      new Date().toISOString(),
      })
      .eq('id', final_attempt_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Award reputation via the consolidated RPC (idempotent)
    //    Signature: update_reputation(p_user_id, p_action, p_entity_id, p_metadata, p_idempotency_key)
    //    'complete_test' maps to: COALESCE((p_metadata->>'points')::integer, 10) in migration 014
    const pointsEarned = score === 100 ? 20 : score >= 80 ? 15 : 10;

    const { error: repError } = await supabase.rpc('update_reputation', {
      p_user_id:         user.id,
      p_action:          'complete_test',
      p_entity_id:       attempt.test_id,
      p_metadata:        { score, points: pointsEarned },
      p_idempotency_key: `test_submit:${updatedAttempt.id}`,
    });

    if (repError) {
      // Non-fatal — attempt is already recorded; log and continue
      console.error('Reputation award error:', repError);
    }

    // 4b. Update review queue with weak concepts (score < 60%)
    try {
      const conceptScores = await extractConceptScores(final_attempt_id, attempt.test_id);
      await updateReviewQueue(user.id, conceptScores);
    } catch (queueError) {
      // Non-fatal — user can still see their score
      console.error('Review queue update error:', queueError);
    }

    // 5. AI Pattern Detection (Phase 6 Polish)
    let aiInsight = null;
    try {
      if (score < 100) {
        // Fetch question details to see what exactly was missed
        const { data: missedQuestions } = await supabase
          .from('practice_answers')
          .select('practice_questions(content, concept_id)')
          .eq('attempt_id', final_attempt_id)
          .eq('is_correct', false);

        if (missedQuestions && missedQuestions.length > 0) {
          const missedConcepts = Array.from(new Set(missedQuestions.map((q: any) => q.practice_questions?.concept_id)));
          aiInsight = {
            detectedWeaknesses: missedConcepts,
            advice: `Patterns suggest a cognitive gap in: ${missedConcepts.join(', ')}. Reviewing these in your new 'Review Queue' is recommended.`
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
