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
    const { content } = await req.json();

    const { data, error } = await supabase
      .from('answers')
      .insert({
        doubt_id: id,
        author_id: user.id,
        content
      })

      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Manually increment answer_count as a fallback for the trigger
    await supabase.rpc('increment_answer_count', { doubt_id_param: id });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
