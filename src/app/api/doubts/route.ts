import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(req.url);
  
  const subjectId   = searchParams.get('subject_id');
  const status      = searchParams.get('status');
  const sort        = searchParams.get('sort');         // 'newest', 'votes', 'trending'
  const filter      = searchParams.get('filter');       // 'unanswered'

  let query = supabase.from('doubts').select('*, profiles(username, avatar_url, reputation_points), subjects(name)');

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (status)    query = query.eq('status', status);

  if (filter === 'unanswered') {
    // Note: depending on schema, we might use a count column or a join
    // For now filter where status is open
    query = query.eq('status', 'open');
  }

  const sortMap: Record<string, { column: string, ascending: boolean }> = {
    'newest': { column: 'created_at', ascending: false },
    'votes': { column: 'votes', ascending: false },
    'trending': { column: 'trending_score', ascending: false },
  };

  const selectedSort = sort && sortMap[sort] ? sortMap[sort] : sortMap['newest'];
  query = query.order(selectedSort.column, { ascending: selectedSort.ascending });

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, subject_id, branch, semester } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('branch, semester')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('doubts')
      .insert({
        author_id: user.id,
        title,
        content,
        subject_id,
        academic_context_snapshot: {
          branch: branch || profile?.branch,
          semester: semester || profile?.semester,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
