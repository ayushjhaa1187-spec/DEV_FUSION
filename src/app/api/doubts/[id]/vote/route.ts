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

    // Fetch current doubt
    const { data: doubt, error: fetchError } = await supabase
      .from('doubts')
      .select('votes, author_id')
      .eq('id', id)
      .single();

    if (fetchError || !doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    // Prevent self-voting
    if (doubt.author_id === user.id) {
      return NextResponse.json({ error: 'Cannot vote on your own doubt' }, { status: 403 });
    }

    // Update vote count directly
    const newVotes = (doubt.votes || 0) + vote_type;
    const { data, error } = await supabase
      .from('doubts')
      .update({ votes: newVotes })
      .eq('id', id)
      .select('id, votes')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ votes: data.votes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
