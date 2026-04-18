import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // test_id
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Fetch test details
    const { data: test, error: testErr } = await supabase
      .from('global_tests')
      .select('id, subject, topic')
      .eq('id', id)
      .single();

    if (testErr || !test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    const durationMinutes = 10;
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    // 2. Create the attempt (only columns that exist in schema: id, user_id, test_id, score, started_at, completed_at)
    const { data: attempt, error: attemptErr } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        test_id: id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptErr) throw attemptErr;

    // 3. Fetch questions (omit correct answers for security)
    const { data: questions, error: qErr } = await supabase
      .from('global_test_questions')
      .select('id, question_text, options, order_index')
      .eq('test_id', id)
      .order('order_index', { ascending: true });

    if (qErr) throw qErr;

    // Return attempt with virtual fields the frontend needs
    return NextResponse.json({
      attempt: {
        ...attempt,
        ends_at: endsAt,       // virtual field for countdown
        status: 'active'       // virtual field for UI
      },
      questions
    });
  } catch (error: any) {
    console.error('Test Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
