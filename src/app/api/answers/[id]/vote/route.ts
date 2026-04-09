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
    const { vote_type } = await req.json();

    if (![1, -1].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type: must be 1 or -1' }, { status: 400 });
    }

    // Get answer author_id for reputation
    const { data: answer } = await supabase
      .from('answers')
      .select('author_id')
      .eq('id', id)
      .single();

    // Upsert vote (prevents double-voting)
    const { data: vote, error: voteError } = await supabase
      .from('answer_votes')
      .upsert(
        { user_id: user.id, answer_id: id, vote_type },
        { onConflict: 'user_id,answer_id' }
      )
      .select()
      .single();

    if (voteError) throw voteError;

    // Recalculate total votes
    const { data: totalData } = await supabase
      .from('answer_votes')
      .select('vote_type')
      .eq('answer_id', id);

    const totalVotes = totalData?.reduce((acc: number, v: any) => acc + v.vote_type, 0) ?? 0;

    // Update cached vote count on answers table
    await supabase
      .from('answers')
      .update({ votes: totalVotes })
      .eq('id', id);

    // Award reputation to answerer (+10) when upvoted (non-fatal)
    if (vote_type === 1 && answer?.author_id && answer.author_id !== user.id) {
      await supabase.rpc('update_reputation', {
        p_user_id: answer.author_id,
        p_action: 'answer_upvoted',
        p_ref_id: id,
      }).then(({ error: repErr }) => {
        if (repErr) console.warn('[vote] Reputation award failed (non-fatal):', repErr.message);
      });
    }

    return NextResponse.json({ totalVotes, userVote: vote_type });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Vote failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
