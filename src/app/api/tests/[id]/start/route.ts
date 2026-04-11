import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Current test_id
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Fetch test details (including subject_id for history tracking)
    const { data: test, error: testErr } = await supabase
      .from('practice_tests')
      .select('id, duration_minutes, subject_id, topic')
      .eq('id', id)
      .single();

    if (testErr || !test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // 2. Create the attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('practice_attempts')
      .insert({
        user_id: user.id,
        test_id: id,
        subject_id: test.subject_id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptErr) throw attemptErr;

    // 3. Fetch questions (omitting correct answers for security)
    const { data: questions, error: qErr } = await supabase
        .from('practice_questions')
        .select('id, question_text, options')
        .eq('test_id', id);

    if (qErr) throw qErr;

    return NextResponse.json({
        attempt,
        questions
    });
  } catch (error: any) {
    console.error('Test Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
