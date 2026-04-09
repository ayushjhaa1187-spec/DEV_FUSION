// src/app/api/doubts/[id]/accept/[answerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { awardReputation } from '@/lib/reputation/ledger';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string; answerId: string } }
) {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the current user owns the doubt
  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .select('user_id, is_resolved')
    .eq('id', params.id)
    .single();

  if (doubtError || !doubt) {
    return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
  }

  if (doubt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden: only doubt author can accept answers' }, { status: 403 });
  }

  if (doubt.is_resolved) {
    return NextResponse.json({ error: 'Doubt already resolved' }, { status: 409 });
  }

  // Fetch answer author for reputation award
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('user_id')
    .eq('id', params.answerId)
    .eq('doubt_id', params.id)
    .single();

  if (answerError || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
  }

  // Mark answer as accepted + resolve doubt (sequential updates)
  const { error: updateAnswerError } = await supabase
    .from('answers')
    .update({ is_accepted: true })
    .eq('id', params.answerId);

  const { error: updateDoubtError } = await supabase
    .from('doubts')
    .update({ is_resolved: true, accepted_answer_id: params.answerId })
    .eq('id', params.id);

  if (updateAnswerError || updateDoubtError) {
    return NextResponse.json({ error: 'Failed to mark answer as accepted' }, { status: 500 });
  }

  // Award reputation to answer author
  try {
    const result = await awardReputation(answer.user_id, 'answer_accepted', params.answerId);
    return NextResponse.json({ success: true, reputation: result });
  } catch (repError) {
    console.error('Reputation award failed:', repError);
    return NextResponse.json({ success: true, reputationError: 'Points award delayed' });
  }
}
