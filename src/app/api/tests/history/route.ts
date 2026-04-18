import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch user's completed test attempts, joining the global_tests for subject/topic info
    const { data: attempts, error } = await supabase
      .from('test_attempts')
      .select(`
        id,
        started_at,
        completed_at,
        status,
        score,
        total_questions,
        global_tests (
            subject,
            topic
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['COMPLETED', 'AUTO_SUBMITTED'])
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[GET /api/tests/history] DB Error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // 2. Format neatly for the frontend Dashboard view
    const formattedHistory = attempts?.map((attempt: any) => ({
      attempt_id: attempt.id,
      subject: attempt.global_tests?.subject || 'Unknown Subject',
      topic: attempt.global_tests?.topic || 'Unknown Topic',
      score: attempt.score,
      total_questions: attempt.total_questions,
      completed_at: attempt.completed_at,
      status: attempt.status,
    })) || [];

    return NextResponse.json({ success: true, history: formattedHistory });

  } catch (error: any) {
    console.error('[GET /api/tests/history] Server Error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
