import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subject_id');
  const authorId = searchParams.get('author_id');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort');
  const filter = searchParams.get('filter');
  const branch = searchParams.get('branch');
  const search = searchParams.get('search');
  const userSubjects = searchParams.get('user_subjects')?.split(',').filter(Boolean) || [];
  try {
    // Use a safe select — only columns guaranteed to exist in the base schema
    let query = supabase
      .from('doubts')
      .select('*, profiles!author_id(username, avatar_url, reputation_points, branch), subjects(name)');

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (authorId) query = query.eq('author_id', authorId);
    if (status) query = query.eq('status', status);
    if (branch) {
      query = query.or(`academic_context_snapshot->>branch.eq.${branch},profiles.branch.eq.${branch}`);
    }
    if (userSubjects.length > 0 && filter === 'my_subjects') {
      query = query.in('subject_id', userSubjects);
    }

    // Full-text search on title, content_text, and content
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,content_text.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`);
    }

    // 'unanswered' filter: doubts with 0 accepted answers
    if (filter === 'unanswered') {
      query = query.is('accepted_answer_id', null);
    }

    // Sort mapping
    const safeSortMap: Record<string, { column: string; ascending: boolean }> = {
      newest: { column: 'created_at', ascending: false },
      oldest: { column: 'created_at', ascending: true },
      votes: { column: 'votes', ascending: false },
    };
    
    if (sort === 'trending') {
      // Trending: doubts with most upvotes + answers in last 7 days
      // For now, we sort by votes and answer_count DESC (if available in view)
      // Since we are using doubts table directly here, we'll sort by votes and limit by date if possible
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('created_at', sevenDaysAgo.toISOString());
      query = query.order('votes', { ascending: false });
    } else {
      const selectedSort = (sort && safeSortMap[sort]) ? safeSortMap[sort] : safeSortMap.newest;
      query = query.order(selectedSort.column, { ascending: selectedSort.ascending });
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
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

  // Sliding-window rate limit check (10 doubt posts / hour)
  const rateCheck = await checkRateLimit(user.id, 'doubt_post');
  if (!rateCheck.allowed) {
    const retryAfterSecs = Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. You can post at most 10 doubts per hour.',
        resetAt: rateCheck.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSecs) },
      }
    );
  }

  try {
    const { title, content, content_text, subject_id, branch, semester, ai_attempted } = await req.json();
    if (!title?.trim() || !content) {
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
        content: typeof content === 'string' ? content : JSON.stringify(content),
        content_jsonb: typeof content === 'object' ? content : null,
        content_text: content_text || (typeof content === 'string' ? content : ''),
        subject_id: subject_id || null,
        ai_attempted: !!ai_attempted,
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

    return NextResponse.json({ ...data, rateLimitRemaining: rateCheck.remaining }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
