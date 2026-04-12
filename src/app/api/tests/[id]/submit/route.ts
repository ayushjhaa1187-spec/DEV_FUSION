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

    // 1. Fetch the attempt to verify it's active
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

    // Create a snapshot for the legacy selected_answers column
    const answers_snapshot: Record<string, number> = {};
    answers?.forEach((a: any) => {
        if (a.selected_index !== null) answers_snapshot[a.question_id] = a.selected_index;
    });

    const { data: questions } = await supabase
        .from('practice_questions')
        .select('id')
        .eq('test_id', attempt.test_id);

    const total = questions?.length || 0;
    const correct = answers?.filter((a: any) => a.is_correct).length || 0;
    const wrong = (answers?.length || 0) - correct;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 3. Mark as completed and update score
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from('practice_attempts')
      .update({
        score,
        correct_count: correct,
        wrong_count: wrong,
        total_questions: total,
        selected_answers: answers_snapshot,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', final_attempt_id)
      .select()
      .single();


    if (updateErr) throw updateErr;

    // 4. Award Reputation for completion
    await supabase.rpc('award_points', {
      u_id: user.id,
      p_count: 10,
      e_type: 'test_completed',
      ent_id: attempt.test_id,
      i_key: 'test_submit_' + updatedAttempt.id
    });

    return NextResponse.json({
      score,
      correct,
      wrong,
      total,
      pointsEarned: 10
    });
  } catch (error: any) {
    console.error('Test Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
