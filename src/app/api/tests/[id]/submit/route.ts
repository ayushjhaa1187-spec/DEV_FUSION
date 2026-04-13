import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

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

    // 5. Award 'Test Ace' badge for a perfect score
    if (score === 100) {
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('name', 'Test Ace')
        .single();

      if (badge) {
        await supabase
          .from('user_badges')
          .upsert(
            { user_id: user.id, badge_id: badge.id },
            { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
          );
      }
    }

    return NextResponse.json({
      score,
      correct,
      wrong,
      total,
      pointsEarned,
      ...(score === 100 ? { badge: 'Test Ace' } : {}),
    });
  } catch (error: any) {
    console.error('Test Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
