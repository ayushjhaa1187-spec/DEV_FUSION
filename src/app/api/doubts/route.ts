import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(req.url);
  
  const subjectId   = searchParams.get('subject_id');
  const status      = searchParams.get('status');
  const sort        = searchParams.get('sort');
  const filter      = searchParams.get('filter');
  const branch      = searchParams.get('branch');
  const userSubjects = searchParams.get('user_subjects')?.split(',') || [];

  let query = supabase.from('doubts').select('*, profiles(username, avatar_url, reputation_points, branch), subjects(name)');

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (status)    query = query.eq('status', status);
  if (branch)    query = query.eq('academic_context_snapshot->branch', branch);
  
  if (userSubjects.length > 0 && filter === 'my_subjects') {
    query = query.in('subject_id', userSubjects);
  }

  if (filter === 'unanswered') {
    // We now use the proper answer_count field
    query = query.eq('answer_count', 0);
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
