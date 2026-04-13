// src/app/api/doubts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateDoubtSchema = z.object({
  title:            z.string().min(10, 'Title must be at least 10 characters').max(200),
  content_markdown: z.string().min(20, 'Content must be at least 20 characters'),
  subject_id:       z.string().uuid('Invalid subject ID').nullable().optional(),
  branch:           z.string().optional().nullable(),
  semester:         z.coerce.number().min(1).max(8).optional().nullable(),
  tags:             z.array(z.string().max(30)).max(5).optional().default([]),
  ai_attempted:     z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // Always use getUser() — never getSession() in server code
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateDoubtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { title, content_markdown, subject_id, branch, semester, tags, ai_attempted } = parsed.data;

  const { data: doubt, error } = await supabase
    .from('doubts')
    .insert({
      author_id:        user.id,
      title:            title.trim(),
      content:          content_markdown, // legacy content column
      content_markdown,
      subject_id:       subject_id || null,
      academic_context_snapshot: {
        branch: branch || null,
        semester: semester || null,
      },
      tags,
      views_count:      0,
      ai_attempted:     ai_attempted || false,
      is_resolved:      false,
    })
    .select('id, title, created_at')
    .single();

  if (error) {
    console.error('[POST /api/doubts]', error);
    return NextResponse.json({ error: 'Failed to create doubt' }, { status: 500 });
  }

  // Award reputation for posting a doubt
  await supabase.rpc('update_reputation', {
    p_user_id:   user.id,
    p_action:    'post_doubt',
    p_entity_id: doubt.id,
  }).then(({ error: repErr }) => {
    if (repErr) console.warn('Reputation award failed (non-fatal):', repErr.message);
  });

  return NextResponse.json({ id: doubt.id, title: doubt.title }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter      = searchParams.get('filter')   ?? 'all';     // all | unanswered | trending | my_subjects | my_branch
  const subjectId   = searchParams.get('subject_id') ?? undefined;
  const branch      = searchParams.get('branch')   ?? undefined;
  const semester    = searchParams.get('semester') ?? undefined;
  const search      = searchParams.get('q')        ?? searchParams.get('search') ?? undefined;
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit       = 20;
  const offset      = (page - 1) * limit;

  let query = supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!author_id (
        username,
        full_name,
        avatar_url,
        reputation_points
      ),
      subjects (
        id,
        name
      ),
      answers ( id )
    `, { count: 'exact' });

  // Apply filters
  if (subjectId)  query = query.eq('subject_id', subjectId);
  if (semester)   query = query.eq('academic_context_snapshot->>semester', semester);

  if (search) {
    // Full-text search using the index or simple ilike
    query = query.or(`title.ilike.%${search}%,content_markdown.ilike.%${search}%`);
  }

  switch (filter) {
    case 'unanswered':
      // Doubts with 0 items in answers array (simulated via status if available, 
      // or we can use the answer_count column if reliable)
      query = query.is('accepted_answer_id', null);
      break;
    case 'trending':
      query = query.order('views_count', { ascending: false });
      break;
    case 'my_subjects': {
      // Get user's subjects from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subjects')
        .eq('id', user.id)
        .single();
      // Note: 'subjects' in profile might be UUIDs or names. 
      // Assuming UUIDs for consistency with subject_id.
      if (profile?.subjects?.length) {
        query = query.in('subject_id', profile.subjects);
      }
      break;
    }
    case 'my_branch': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('branch')
        .eq('id', user.id)
        .single();
      if (profile?.branch) {
        query = query.or(`academic_context_snapshot->>branch.eq.${profile.branch},profiles.branch.eq.${profile.branch}`);
      }
      break;
    }
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: doubts, error, count } = await query;

  if (error) {
    console.error('[GET /api/doubts]', error);
    return NextResponse.json({ error: 'Failed to fetch doubts' }, { status: 500 });
  }

  return NextResponse.json({
    doubts: doubts ?? [],
    total: count ?? 0,
    page,
    limit,
    has_more: (count ?? 0) > page * limit,
  });
}
