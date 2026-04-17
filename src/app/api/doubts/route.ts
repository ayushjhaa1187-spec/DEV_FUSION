// src/app/api/doubts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const DoubtSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(10),
  subject: z.string().min(2).max(100),
  branch: z.string().optional(),
  semester: z.string().or(z.number()).optional(),
});

/**
 * POST /api/doubts
 * Phase 2: Core Functional Stabilization
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const parsed = DoubtSchema.parse(raw);

    // 1. Insert Doubt
    const { data: doubt, error: doubtError } = await supabase
      .from('doubts')
      .insert({
        author_id: user.id,
        title: parsed.title,
        content: parsed.body,
        content_markdown: parsed.body,
        // Map subject to subject_id if it's a UUID, else generic
        subject_id: parsed.subject.length > 20 ? parsed.subject : null,
        branch: parsed.branch,
        semester: parsed.semester ? parseInt(parsed.semester.toString()) : null,
        is_resolved: false,
      })
      .select('id, title')
      .single();

    if (doubtError) throw doubtError;

    // 2. Award Reputation
    await supabase.rpc('update_reputation', {
      p_user_id: user.id,
      p_action: 'post_doubt',
      p_entity_id: doubt.id
    });

    return NextResponse.json({ success: true, data: doubt }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/doubts] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create doubt' }, { status: 500 });
  }
}

/**
 * GET /api/doubts
 * Fetches doubts with filters.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser(); // Harden auth even on GET for Student view

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter      = searchParams.get('filter')   || 'all';
  const subjectId   = searchParams.get('subject_id');
  const search      = searchParams.get('q') || searchParams.get('search');
  const branch      = searchParams.get('branch');
  const semester    = searchParams.get('semester');
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit       = 20;
  const offset      = (page - 1) * limit;
 
  let query = supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!author_id (username, full_name, avatar_url, reputation_points),
      subjects (id, name),
      answers ( id )
    `, { count: 'exact' });
 
  if (subjectId)  query = query.eq('subject_id', subjectId);
  if (branch)     query = query.eq('branch', branch);
  if (semester)   query = query.eq('semester', parseInt(semester));
  if (search)     query = query.or(`title.ilike.%${search}%,content_markdown.ilike.%${search}%`);

  if (filter === 'unanswered') {
    query = query.is('accepted_answer_id', null);
  } else if (filter === 'trending') {
    query = query.order('views_count', { ascending: false });
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: doubts, error, count } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      doubts: doubts || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > page * limit,
    }
  });
}
