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
    const { vote_type } = await req.json(); // 1 or -1

    const { error } = await supabase
      .from('answer_votes')
      .upsert({
        answer_id: id,
        user_id: user.id,
        vote_type
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Recalculate total votes (could also be done via trigger, but doing it here for simplicity in v1)
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
