import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

// GET — fetch user's enrolled subjects
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_subjects')
    .select('subjects(id, name, code)')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.map((d: any) => d.subjects) ?? []);
}

// POST — update user's enrolled subjects (replace all)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { subject_ids } = await req.json();
    if (!Array.isArray(subject_ids)) {
      return NextResponse.json({ error: 'subject_ids must be an array' }, { status: 400 });
    }

    // Replace enrollment strategy: delete existing, then batch insert new
    await supabase.from('user_subjects').delete().eq('user_id', user.id);

    if (subject_ids.length > 0) {
      const rows = subject_ids.map((sid: string) => ({
        user_id: user.id, subject_id: sid
      }));
      const { error } = await supabase.from('user_subjects').insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
