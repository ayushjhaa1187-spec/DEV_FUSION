import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subject_id');
  const status = searchParams.get('status');

  let query = supabase
    .from('doubts')
    .select('*, profiles(username, avatar_url), subjects(name)');

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, subject_id, branch, semester } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('branch, semester')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('doubts')
      .insert({
        author_id: user.id,
        title,
        content,
        subject_id,
        academic_context_snapshot: {
          branch: branch || profile?.branch,
          semester: semester || profile?.semester,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
