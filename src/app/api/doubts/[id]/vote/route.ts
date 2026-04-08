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

    // Use RPC if available, or manual update
    // We'll use a transaction logic here
    const { data: vote, error: voteError } = await supabase
      .from('doubt_votes') // We need to create this table
      .upsert(
        { user_id: user.id, doubt_id: id, vote_type },
        { onConflict: 'user_id,doubt_id' }
      )
      .select()
      .single();

    if (voteError) throw voteError;

    // Recalculate total votes for the doubt
    // (In production, a trigger would handle this)
    const { data: totalData } = await supabase
      .from('doubt_votes')
      .select('vote_type')
      .eq('doubt_id', id);
    
    const totalVotes = totalData?.reduce((acc: number, v: any) => acc + v.vote_type, 0) || 0;

    await supabase
      .from('doubts')
      .update({ votes: totalVotes })
      .eq('id', id);

    return NextResponse.json({ success: true, totalVotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
