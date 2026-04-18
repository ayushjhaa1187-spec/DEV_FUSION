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
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch doubt with author profile, subjects, and answers
  // Adjusted author:profiles!author_id to match specific foreign key requirement
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
        raw_votes:answer_votes (
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

  // Increment view count (fire-and-forget)
  supabase
    .from('doubts')
    .update({ views_count: (doubt.views_count ?? 0) + 1 })
    .eq('id', id)
    .then(() => {});

  // Compute per-answer vote totals and current user's vote
  const answersWithVotes = (doubt.answers ?? []).map((answer: any) => {
    const rawVotes: any[] = answer.raw_votes ?? [];
    
    // Robust vote counting: handles both Legacy INT (1/-1) and Modern TEXT ('up'/'down')
    const upvotes   = rawVotes.filter(v => v.vote_type === 'up' || v.vote_type === 1 || v.vote_type === '1').length;
    const downvotes = rawVotes.filter(v => v.vote_type === 'down' || v.vote_type === -1 || v.vote_type === '-1').length;
    
    // Identify current user's vote status
    let userVote = null;
    if (user) {
      const found = rawVotes.find(v => v.user_id === user.id);
      if (found) {
        userVote = (found.vote_type === 'up' || found.vote_type === 1 || found.vote_type === '1') ? 'up' : 'down';
      }
    }

    return {
      ...answer,
      upvotes,
      downvotes,
      votes: upvotes - downvotes,
      user_vote: userVote,
      raw_votes: undefined, // strip raw relations from response
    };
  }).sort((a: any, b: any) => {
    if (a.is_accepted && !b.is_accepted) return -1;
    if (!a.is_accepted && b.is_accepted) return 1;
    return b.votes - a.votes;
  });

  return NextResponse.json({
    success: true,
    data: {
      ...doubt,
      is_author: user ? (doubt.author_id === user.id) : false,
      answers: answersWithVotes,
    }
  });
}
