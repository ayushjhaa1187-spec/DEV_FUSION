import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { vote_type: voteType } = await req.json(); // 1 or -1

    const { data: existing } = await supabase
      .from('answer_votes')
      .select('id, vote_type')
      .eq('user_id', user.id)
      .eq('answer_id', id)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote (toggle off)
        await supabase.from('answer_votes').delete().eq('id', existing.id);
      } else {
        // Change vote type
        await supabase.from('answer_votes').update({ vote_type: voteType }).eq('id', existing.id);
      }
    } else {
      await supabase.from('answer_votes').insert({ user_id: user.id, answer_id: id, vote_type: voteType });
    }
    
    // Recalculate total votes
    const { data: votes } = await supabase
      .from('answer_votes')
      .select('vote_type')
      .eq('answer_id', id);
      
    const totalVotes = votes?.reduce((acc: number, curr: { vote_type: number }) => acc + curr.vote_type, 0) || 0;

    await supabase
      .from('answers')
      .update({ votes: totalVotes })
      .eq('id', id);

    return NextResponse.json({ success: true, totalVotes });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
