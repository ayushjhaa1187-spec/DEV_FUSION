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
  // Try to get user for voting status, but don't block
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // Standardized join: avoids FK ambiguity and handles aliases cleanly
    const { data: doubt, error } = await supabase
      .from('doubts')
      .select(`
        *,
        author:profiles!author_id (
          id, username, full_name, avatar_url, college, branch, reputation_points
        ),
        subjects ( id, name ),
        answers (
          id, content_markdown, is_accepted, created_at,
          author:profiles!author_id ( id, username, full_name, avatar_url, reputation_points ),
          raw_votes:answer_votes ( vote_type, user_id )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Doubt not found' }, { status: 404 });
      }
      throw error;
    }

    // Increment view count (fire-and-forget)
    supabase.from('doubts')
      .update({ views_count: (doubt.views_count ?? 0) + 1 })
      .eq('id', id)
      .then(() => {});

    // Map votes with robust null-safety
    const answersWithVotes = (doubt.answers ?? []).map((answer: any) => {
      const voteData = answer.raw_votes || [];
      const upvotes = voteData.filter((v: any) => v.vote_type === 'up' || v.vote_type === 1).length;
      const downvotes = voteData.filter((v: any) => v.vote_type === 'down' || v.vote_type === -1).length;
      
      let userVote = null;
      if (user) {
        const myVote = voteData.find((v: any) => v.user_id === user.id);
        if (myVote) {
          userVote = (myVote.vote_type === 'up' || myVote.vote_type === 1) ? 'up' : 'down';
        }
      }

      return {
        ...answer,
        upvotes,
        downvotes,
        votes: upvotes - downvotes,
        user_vote: userVote,
        raw_votes: undefined
      };
    }).sort((a: any, b: any) => (b.is_accepted ? 1 : 0) - (a.is_accepted ? 1 : 0) || b.votes - a.votes);

    return NextResponse.json({
      success: true,
      data: {
        ...doubt,
        is_author: user?.id === doubt.author_id,
        answers: answersWithVotes
      }
    });

  } catch (err: any) {
    console.error('[GET /api/doubts/[id]] API Error:', err.message || err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve doubt details. Please ensure your neural link is stable.' 
    }, { status: 500 });
  }
}
