import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const mentorId = searchParams.get('mentor_id');

  if (!mentorId) return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('mentor_slots')
    .select('*')
    .eq('mentor_id', mentorId)
    .eq('is_booked', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Verify user is a mentor
  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { start_time, end_time } = await req.json();

    const { data, error } = await supabase
      .from('mentor_slots')
      .insert({
        mentor_id: user.id,
        start_time,
        end_time
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
