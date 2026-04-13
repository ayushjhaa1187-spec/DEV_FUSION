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
    const { vote_type } = await req.json(); // 1 or -1
    if (![1, -1].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Fetch current doubt author for reputation
    const { data: doubt, error: fetchError } = await supabase
      .from('doubts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (fetchError || !doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    if (doubt.author_id === user.id) {
      return NextResponse.json({ error: 'Cannot vote on your own doubt' }, { status: 403 });
    }

    // Upsert vote record
    const { error: voteError } = await supabase
      .from('doubt_votes')
      .upsert(
        { user_id: user.id, doubt_id: id, vote_type },
        { onConflict: 'user_id,doubt_id' }
      );

    if (voteError) throw voteError;

    // Recalculate total votes for this doubt
    const { data: totalData } = await supabase
      .from('doubt_votes')
      .select('vote_type')
      .eq('doubt_id', id);

    const totalVotes = totalData?.reduce((acc: number, v: any) => acc + v.vote_type, 0) ?? 0;

    // Update cached count in doubts table
    const { data: updatedDoubt, error: updateError } = await supabase
      .from('doubts')
      .update({ votes: totalVotes })
      .eq('id', id)
      .select('votes')
      .single();

    if (updateError) throw updateError;

    // Optional: award points to doubt author for upvote (+2)
    if (vote_type === 1) {
      await supabase.rpc('update_reputation', {
        p_user_id:   doubt.author_id,
        p_action:    'vote_up',
        p_entity_id: id,
      }).then(({ error: repErr }) => {
        if (repErr) console.warn('[doubt-vote] Reputation failed:', repErr.message);
      });
    }

    return NextResponse.json({ votes: updatedDoubt.votes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
