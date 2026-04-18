import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // We want to return unique subjects and topics available in the bank.
    // Grouping by is ideal, but Supabase (PostgREST) doesn't have a direct "SELECT DISTINCT"
    // that returns clean JSON arrays easily without RPC or standard query filters.
    // However, since it's a global bank, we can just fetch all and reduce in memory
    // (or, if the bank grows huge, we can create a PostgreSQL view/RPC. For now in memory is fine).

    const { data: tests, error } = await supabase
      .from('global_tests')
      .select('subject, topic, total_questions');

    if (error) {
      console.error('[GET /api/tests/bank] Supabase error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Process into an organized structure:
    // { "Machine Learning": ["Neural Networks", "SVMs"], "React": ["Hooks", "Context"] }
    const structuredBank: Record<string, { topic: string, total_questions: number }[]> = {};

    for (const row of (tests || [])) {
      if (!structuredBank[row.subject]) {
        structuredBank[row.subject] = [];
      }
      // Check for duplicates just in case
      if (!structuredBank[row.subject].find((t) => t.topic === row.topic)) {
        structuredBank[row.subject].push({
          topic: row.topic,
          total_questions: row.total_questions,
        });
      }
    }

    return NextResponse.json({ success: true, bank: structuredBank });

  } catch (error: any) {
    console.error('[GET /api/tests/bank] Internal error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
