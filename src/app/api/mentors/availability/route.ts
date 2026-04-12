import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mentorId = searchParams.get('mentorId');

  if (!mentorId) return NextResponse.json({ error: 'Mentor ID required' }, { status: 400 });

  const supabase = await createSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { availability } = await req.json(); // Array of { day_of_week, start_time, end_time }

    // First, delete existing availability for this mentor
    const { error: deleteError } = await supabase
      .from('mentor_availability')
      .delete()
      .eq('mentor_id', user.id);

    if (deleteError) throw deleteError;

    // Then insert new availability
    if (availability && availability.length > 0) {
      const { error: insertError } = await supabase
        .from('mentor_availability')
        .insert(availability.map((a: any) => ({
          ...a,
          mentor_id: user.id
        })));

      if (insertError) throw insertError;
    }

    return NextResponse.json({ message: 'Availability updated successfully' });
  } catch (error: any) {
    console.error('Availability POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
