// src/app/api/doubts/[id]/accept/[answerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { awardReputation } from '@/lib/reputation/ledger';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  const { id, answerId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the current user owns the doubt
  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .select('author_id, status')
    .eq('id', id)
    .single();

  if (doubtError || !doubt) {
    return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
  }

  if (doubt.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden: only doubt author can accept answers' }, { status: 403 });
  }

  if (doubt.status === 'resolved') {
    return NextResponse.json({ error: 'Doubt already resolved' }, { status: 409 });
  }

  // Fetch answer author for reputation award
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('author_id')
    .eq('id', answerId)
    .eq('doubt_id', id)
    .single();

  if (answerError || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
  }

  // Mark answer as accepted + resolve doubt (sequential updates)
  const [updateAnswerRes, updateDoubtRes] = await Promise.all([
    supabase
      .from('answers')
      .update({ is_accepted: true })
      .eq('id', answerId),
    supabase
      .from('doubts')
      .update({ 
        status: 'resolved',
        accepted_answer_id: answerId
      })
      .eq('id', id)
  ]);

  if (updateAnswerRes.error || updateDoubtRes.error) {
    return NextResponse.json({ error: 'Failed to mark answer as accepted' }, { status: 500 });
  }

  // Award reputation to answer author (25 points for accepted answer)
  try {
    const { error: repErr } = await supabase.rpc('award_points', {
      u_id: answer.author_id,
      p_count: 25,
      e_type: 'answer_accepted',
      ent_id: answerId,
      i_key: `accept_${answerId}`
    });
    
    if (repErr) throw repErr;

    // Notify the answer author
    await supabase.from('notifications').insert({
      user_id: answer.author_id,
      type: 'answer_accepted',
      message: `Your answer was accepted! You earned 25 reputation points.`,
      link: `/doubts/${id}`
    });

    return NextResponse.json({ success: true });
  } catch (repError) {
    console.error('Reputation award failed:', repError);
    return NextResponse.json({ success: true, reputationError: 'Points award delayed' });
  }
}
