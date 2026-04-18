import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndAwardBadges } from '@/lib/reputation/badges';

/**
 * PATCH /api/doubts/[id]/accept/[answerId]
 * Marks an answer as accepted and awards reputation to the helper.
 * Only the original poster (author_id) can trigger this.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> }
) {
  const { id, answerId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Ownership & Existence Check
    const { data: doubt, error: doubtError } = await supabase
      .from('doubts')
      .select('author_id, accepted_answer_id')
      .eq('id', id)
      .single();

    if (doubtError || !doubt) {
      return NextResponse.json({ success: false, error: 'Doubt not found' }, { status: 404 });
    }

    if (doubt.author_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Only the original poster can accept an answer' }, { status: 403 });
    }

    if (doubt.accepted_answer_id) {
      return NextResponse.json({ success: false, error: 'A solution has already been accepted for this doubt' }, { status: 400 });
    }

    // 2. Fetch Answer author for reputation
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('author_id')
      .eq('id', answerId)
      .eq('doubt_id', id)
      .single();

    if (answerError || !answer) {
      return NextResponse.json({ success: false, error: 'Answer not found or not linked to this doubt' }, { status: 404 });
    }

    // 3. Perform Updates (Atomic sequence)
    // Update answer
    const { error: updateAnswerError } = await supabase
      .from('answers')
      .update({ is_accepted: true })
      .eq('id', answerId);

    if (updateAnswerError) throw updateAnswerError;

    // Update doubt
    const { error: updateDoubtError } = await supabase
      .from('doubts')
      .update({ 
        accepted_answer_id: answerId,
        status: 'resolved' 
      })
      .eq('id', id);

    if (updateDoubtError) throw updateDoubtError;

    // 4. Award Reputation to the ANSWER owner (+25)
    await supabase.rpc('update_reputation', {
      p_user_id: answer.author_id,
      p_action: 'answer_accepted',
      p_entity_id: answerId
    });

    // 5. Notify the answer author
    await supabase.from('notifications').insert({
      user_id: answer.author_id,
      type: 'answer_accepted',
      title: 'Solution Accepted!',
      message: 'Your answer was marked as the accepted solution! You earned +25 reputation.',
      link: `/doubts/${id}`
    });

    // 6. Check for badges
    await checkAndAwardBadges(answer.author_id);

    return NextResponse.json({ success: true, data: { status: 'resolved' } });
  } catch (error: any) {
    console.error('[PATCH /api/doubts/accept] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Failed to accept answer' }, { status: 500 });
  }
}
