import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json([]);
    }

    // Fetch live/upcoming sessions from mentors the user has booked or follows
    const { data: bookings, error } = await supabase
      .from('mentor_bookings')
      .select(`
        id,
        scheduled_at,
        meeting_link,
        status,
        mentors:mentor_id (
          id,
          specialty,
          profiles!id ( username, full_name, avatar_url )
        )
      `)
      .eq('student_id', user.id)
      .eq('status', 'confirmed')
      .gte('scheduled_at', new Date(Date.now() - 3600000).toISOString()) // sessions in the last 1h or upcoming
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Followed sessions error:', error.message);
      return NextResponse.json([]);
    }

    // Map to a simpler session shape
    const sessions = (bookings || []).map((b: any) => ({
      id: b.id,
      start_time: b.scheduled_at,
      meeting_link: b.meeting_link,
      is_live: new Date(b.scheduled_at) <= new Date() && new Date(b.scheduled_at) >= new Date(Date.now() - 3600000),
      mentor_profiles: b.mentors ? { specialty: b.mentors.specialty } : null,
      profiles: b.mentors?.profiles ?? null,
    }));

    return NextResponse.json(sessions);
  } catch (err) {
    console.error('Followed sessions route error:', err);
    return NextResponse.json([]);
  }
}
