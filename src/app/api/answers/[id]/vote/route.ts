import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { vote_type } = await req.json(); // Now 'up' or 'down'

    if (!['up', 'down'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type: must be "up" or "down"' }, { status: 400 });
    }

    const vote_val = vote_type === 'up' ? 1 : -1;

    // Upsert vote (prevents double-voting and handles mutual exclusivity)
    const { data: vote, error: voteError } = await supabase
      .from('answer_votes')
      .upsert(
        { user_id: user.id, answer_id: id, vote_type: vote_val },
        { onConflict: 'user_id,answer_id' }
      )
      .select()
      .single();

    if (voteError) throw voteError;

    // Fetch the updated count from answers table (which is updated by the database trigger)
    const { data: updatedAnswer } = await supabase
      .from('answers')
      .select('votes')
      .eq('id', id)
      .single();

    const totalVotes = updatedAnswer?.votes ?? 0;

    // Use 'answer_upvoted' as per the update_reputation function definition
    if (vote_type === 'up') {
      const { data: authorData } = await supabase
        .from('answers')
        .select('author_id, doubt_id, doubts(title)')
        .eq('id', id)
        .single();

      if (authorData && authorData.author_id !== user.id) {
        const doubtTitle = (authorData.doubts as any)?.title || 'your post';
        
        // Update reputation via RPC
        await supabase.rpc('update_reputation', {
          p_user_id:   authorData.author_id,
          p_action:    'answer_upvoted',
          p_entity_id: id,
        });

        // Send notification
        await supabase.from('notifications').insert({
          user_id: authorData.author_id,
          title: '⭐ New Upvote!',
          message: `⭐ Your answer to "${doubtTitle}" received an upvote!`,
          type: 'reputation_gain',
          link: `/doubts/${authorData.doubt_id}`
        });
      }
    }

    return NextResponse.json({ totalVotes, userVote: vote_type });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Vote failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
