import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const mentorId = searchParams.get('mentor_id');

  if (!mentorId) return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });

  // Resolve mentor_profiles.id from profiles.id if necessary
  // (Assuming frontend might pass the user's UUID)
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .or(`id.eq.${mentorId},user_id.eq.${mentorId}`)
    .single();

  if (!mentorProfile) return NextResponse.json({ data: [] });

  const { data, error } = await supabase
    .from('mentor_slots')
    .select('*')
    .eq('mentor_id', mentorProfile.id)
    .eq('status', 'available')
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
        mentor_id: mentor.id,
        start_time,
        end_time,
        status: 'available'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
