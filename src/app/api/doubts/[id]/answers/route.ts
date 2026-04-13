import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('answers')
    .select('*, profiles(username, avatar_url, reputation_points)')
    .eq('doubt_id', id)
    .order('is_accepted', { ascending: false })
    .order('votes', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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
    const { content_markdown } = await req.json();

    if (!content_markdown || content_markdown.length < 10) {
      return NextResponse.json({ error: 'Answer content is too short' }, { status: 400 });
    }

    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        doubt_id: id,
        author_id: user.id,
        content: content_markdown, // legacy redundancy
        content_markdown,
      })
      .select(`
        *,
        profiles:author_id (
          username,
          avatar_url,
          reputation_points
        )
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });


    // Award reputation for posting an answer
    await supabase.rpc('update_reputation', {
      p_user_id:   user.id,
      p_action:    'post_answer',
      p_entity_id: answer.id,
    }).then(({ error: repErr }) => {
      if (repErr) console.warn('Reputation award failed (non-fatal):', repErr.message);
    });

    // Notify the doubt author
    const { data: doubt } = await supabase
      .from('doubts')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (doubt && doubt.author_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      // type must match ENUM: answer_received, answer_posted, etc.
      await supabase.from('notifications').insert({
        user_id: doubt.author_id,
        type: 'answer_posted',
        title: 'New Answer Received',
        message: `${profile?.username ?? 'Someone'} answered your doubt`,
        metadata: {
          doubt_title: doubt.title,
          answer_id: answer.id
        },
        link: `/doubts/${id}`
      });
    }

    return NextResponse.json(answer);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
