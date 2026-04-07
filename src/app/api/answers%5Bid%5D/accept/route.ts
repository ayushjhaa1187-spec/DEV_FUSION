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

  // 1. Get the answer and the associated doubt author
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('doubt_id, author_id')
    .eq('id', id)
    .single();

  if (answerError || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
  }

  const { data: doubt, error: doubtError } = await supabase
    .from('doubts')
    .select('author_id')
    .eq('id', answer.doubt_id)
    .single();

  if (doubtError || !doubt) {
    return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
  }

  // 2. Check if the user is the doubt author
  if (doubt.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Update the answer status (trigger will handle reputation)
  const { error: updateError } = await supabase
    .from('answers')
    .update({ is_accepted: true })
    .eq('id', id);


  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 4. Update the doubt status
  await supabase
    .from('doubts')
    .update({ status: 'resolved' })
    .eq('id', answer.doubt_id);

  return NextResponse.json({ success: true, message: 'Answer accepted as solution' });
}
