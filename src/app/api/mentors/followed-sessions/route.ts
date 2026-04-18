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
      .from('bookings')
      .select(`
        id,
        status,
        meeting_link,
        availability_slots:slot_id(start_time),
        mentor_profiles:mentor_id (
          id,
          profiles!inner ( username, full_name, avatar_url )
        )
      `)
      .eq('student_id', user.id)
      .eq('status', 'confirmed')
      // Note: Filter for scheduled_at is tricky with joins, so we'll fetch and filter in JS if needed,
      // but I'll try to keep it simple.
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Followed sessions error:', error.message);
      return NextResponse.json([]);
    }

    // Map to a simpler session shape
    const sessions = (bookings || []).map((b: any) => ({
      id: b.id,
      start_time: b.availability_slots?.start_time || b.created_at,
      meeting_link: b.meeting_link,
      is_live: b.availability_slots?.start_time ? (new Date(b.availability_slots.start_time) <= new Date() && new Date(b.availability_slots.start_time) >= new Date(Date.now() - 3600000)) : false,
      mentor_profiles: b.mentor_profiles ? { specialty: (b.mentor_profiles as any).specialty || 'Mentor' } : null,
      profiles: b.mentor_profiles?.profiles ?? null,
    }));

    return NextResponse.json(sessions);
  } catch (err) {
    console.error('Followed sessions route error:', err);
    return NextResponse.json([]);
  }
}
