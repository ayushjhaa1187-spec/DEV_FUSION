import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { attempt_id, question_id, selected_index } = await req.json();

    if (!attempt_id || !question_id || selected_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify attempt is still active and belongs to user
    const { data: attempt, error: attemptErr } = await supabase
      .from('practice_attempts')
      .select('id, ends_at, status')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'active' || new Date(attempt.ends_at) < new Date()) {
        return NextResponse.json({ error: 'Test session has ended' }, { status: 403 });
    }

    // 2. Fetch correct answer index to mark is_correct in real-time
    const { data: question } = await supabase
        .from('practice_questions')
        .select('correct_answer_index')
        .eq('id', question_id)
        .single();

    const is_correct = question ? question.correct_answer_index === selected_index : false;

    // 3. Upsert answer
    const { error } = await supabase
      .from('practice_answers')
      .upsert({
        attempt_id,
        question_id,
        selected_index,
        is_correct,
        created_at: new Date().toISOString()
      }, { onConflict: 'attempt_id,question_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Answer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
