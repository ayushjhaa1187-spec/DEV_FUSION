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
    const { answers } = await req.json(); // Array of indices

    // 1. Fetch correct answers for the test
    const { data: questions, error } = await supabase
      .from('practice_questions')
      .select('id, correct_answer_index')
      .eq('test_id', id);

    if (error || !questions) {
      return NextResponse.json({ error: 'Failed to fetch test questions' }, { status: 500 });
    }

    // 2. Score the attempt
    let score = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer_index) {
        score++;
      }
    });

    const finalScore = Math.round((score / questions.length) * 100);

    // 3. Record Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('practice_attempts')
      .insert({
        user_id: user.id,
        test_id: id,
        score: finalScore,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 500 });

    // 4. Award Reputation (Atomic point logic)
    // We can use RPC or insert into ledger
    await supabase.rpc('award_points', {
      u_id: user.id,
      p_count: 5,
      e_type: 'test_complete',
      ent_id: id,
      i_key: 'test_att_' + attempt.id
    });


    return NextResponse.json({
      score: finalScore,
      pointsEarned: 5,
      attemptId: attempt.id
    });
  } catch (error) {
    console.error('Test Submission Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
