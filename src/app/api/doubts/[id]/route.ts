// src/app/api/doubts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid doubt ID' }, { status: 400 });
  }

  const supabase = await createSupabaseServer();

  // Validate session — getUser() revalidates with Supabase Auth server
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch doubt with author profile, subjects, and answers
  // Adjusted user_id -> author_id to match original schema
  const { data: doubt, error } = await supabase
    .from('doubts')
    .select(`
      *,
      author:profiles!author_id (
        id,
        username,
        full_name,
        avatar_url,
        college,
        branch,
        reputation_points
      ),
      subjects (
        id,
        name
      ),
      answers (
        id,
        content_markdown,
        is_accepted,
        created_at,
        author_id,
        author:profiles!author_id (
          id,
          username,
          full_name,
          avatar_url,
          reputation_points
        ),
        votes:answer_votes (
          vote_type,
          user_id
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Doubt not found' }, { status: 404 });
    }
    console.error('[GET /api/doubts/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch doubt' }, { status: 500 });
  }

  // Increment view count (fire-and-forget — do NOT await, don't block response)
  supabase
    .from('doubts')
    .update({ views_count: (doubt.views_count ?? 0) + 1 })
    .eq('id', id)
    .then(() => {});

  // Compute per-answer vote totals and current user's vote
  const answersWithVotes = (doubt.answers ?? []).map((answer: any) => {
    const votes: { vote_type: string; user_id: string }[] = answer.votes ?? [];
    const upvotes   = votes.filter(v => v.vote_type === 'up').length;
    const downvotes = votes.filter(v => v.vote_type === 'down').length;
    const userVote  = votes.find(v => v.user_id === user.id)?.vote_type ?? null;

    return {
      ...answer,
      upvotes,
      downvotes,
      net_votes: upvotes - downvotes,
      user_vote: userVote,
      votes: undefined, // strip raw votes array from response
    };
  }).sort((a: any, b: any) => {
    // Accepted answer always first, then by net votes
    if (a.is_accepted && !b.is_accepted) return -1;
    if (!a.is_accepted && b.is_accepted) return 1;
    return b.net_votes - a.net_votes;
  });

  return NextResponse.json({
    success: true,
    data: {
      ...doubt,
      is_author: doubt.author_id === user.id,
      answers: answersWithVotes,
    }
  });
}
