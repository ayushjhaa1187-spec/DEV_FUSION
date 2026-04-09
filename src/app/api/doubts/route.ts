import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);

  const subjectId    = searchParams.get('subject_id');
  const status       = searchParams.get('status');
  const sort         = searchParams.get('sort');
  const filter       = searchParams.get('filter');
  const branch       = searchParams.get('branch');
  const search       = searchParams.get('search');
  const userSubjects = searchParams.get('user_subjects')?.split(',').filter(Boolean) || [];

  try {
    // Use a safe select — only columns guaranteed to exist in the base schema
    let query = supabase
      .from('doubts')
      .select('*, profiles!author_id(username, avatar_url, reputation_points, branch), subjects(name)');

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (status)    query = query.eq('status', status);
    if (branch)    query = query.eq('academic_context_snapshot->>branch', branch);

    if (userSubjects.length > 0 && filter === 'my_subjects') {
      query = query.in('subject_id', userSubjects);
    }

    // Full-text search on title and content
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`);
    }

    // 'unanswered' filter
    if (filter === 'unanswered') {
      query = query.eq('status', 'open');
    }

    // Safe sort — only use created_at and votes (always present); skip trending_score
    const safeSortMap: Record<string, { column: string; ascending: boolean }> = {
      newest:   { column: 'created_at', ascending: false },
      oldest:   { column: 'created_at', ascending: true  },
      votes:    { column: 'votes',      ascending: false },
      trending: { column: 'created_at', ascending: false }, // fallback until trending_score column exists
    };
    const selectedSort = (sort && safeSortMap[sort]) ? safeSortMap[sort] : safeSortMap.newest;
    query = query.order(selectedSort.column, { ascending: selectedSort.ascending });

    // Pagination
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from  = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error('[GET /api/doubts] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[GET /api/doubts] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, subject_id, branch, semester } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('branch, semester')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('doubts')
      .insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        subject_id: subject_id || null,
        academic_context_snapshot: {
          branch: branch || profile?.branch,
          semester: semester || profile?.semester,
          timestamp: new Date().toISOString(),
        },
      })
      .select('*, profiles!author_id(username, avatar_url, reputation_points), subjects(name)')
      .single();

    if (error) {
      console.error('[POST /api/doubts] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award reputation for posting a doubt
    await supabase.rpc('update_reputation', {
      p_user_id: user.id,
      p_action: 'post_doubt',
      p_ref_id: data.id,
    }).then(({ error: repErr }) => {
      if (repErr) console.warn('Reputation award failed (non-fatal):', repErr.message);
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
