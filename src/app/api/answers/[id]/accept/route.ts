import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

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

  // 1. Get the answer with author_id
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('doubt_id, author_id')
    .eq('id', id)
    .single();

  if (answerError || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
  }

  // 2. Verify the requester is the doubt author
  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .select('author_id')
    .eq('id', answer.doubt_id)
    .single();

  if (doubtError || !doubt) {
    return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
  }

  if (doubt.author_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: only the doubt author can accept answers' },
      { status: 403 }
    );
  }

  // 3. Unaccept any previously accepted answer for this doubt
  await supabase
    .from('answers')
    .update({ is_accepted: false })
    .eq('doubt_id', answer.doubt_id)
    .eq('is_accepted', true);

  // 4. Mark this answer as accepted
  const { error: updateError } = await supabase
    .from('answers')
    .update({ is_accepted: true })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 5. Resolve the doubt
  await supabase
    .from('doubts')
    .update({ status: 'resolved' })
    .eq('id', answer.doubt_id);

  // 6. Award reputation to the answerer (+25 for accepted answer)
  await supabase.rpc('update_reputation', {
    p_user_id: answer.author_id,
    p_action: 'answer_accepted',
    p_ref_id: id,
  }).then(({ error: repErr }) => {
    if (repErr) console.warn('[accept] Reputation award failed (non-fatal):', repErr.message);
  });

  // 7. Send notification to the answerer
  await supabase.from('notifications').insert({
    user_id: answer.author_id,
    type: 'answer_accepted',
    title: 'Your answer was accepted!',
    message: 'Your answer was marked as the accepted solution. +25 reputation',
    reference_id: id,
  }).then(({ error: notifErr }) => {
    if (notifErr) console.warn('[accept] Notification failed (non-fatal):', notifErr.message);
  });

  // 8. Audit log
  await logAuditEvent(user.id, 'answer_accepted', 'answer', id, {
    doubt_id: answer.doubt_id,
    answerer_id: answer.author_id,
  });

  return NextResponse.json({ success: true, message: 'Answer accepted as solution' });
}
