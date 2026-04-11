import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const subjectId = url.searchParams.get('subjectId');

  try {
    let query = supabase
      .from('practice_attempts')
      .select(`
        *,
        practice_tests (
          topic,
          duration_minutes,
          subjects (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: attempts, error } = await query;

    if (error) throw error;

    return NextResponse.json(attempts || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

