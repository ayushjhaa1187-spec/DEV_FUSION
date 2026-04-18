import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generateJitsiRoomName, getJitsiMeetUrl } from '@/lib/jitsi';

const SESSION_SELECT = `
  id,
  student_id,
  mentor_id,
  slot_id,
  status,
  amount,
  jitsi_room_name,
  meeting_link,
  feedback_score,
  feedback_comment,
  created_at,
  availability_slots:slot_id(start_time, end_time),
  mentor_profiles:mentor_id(
    id,
    user_id,
    profiles:user_id(full_name, avatar_url, username)
  ),
  student_profile:profiles!student_id(full_name, avatar_url, username)
`;

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Fetch all bookings where current user is student or mentor
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(SESSION_SELECT)
    .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessions = (bookings || []).map((b: any) => {
    const startTime = b.availability_slots?.start_time;
    const roomName = b.jitsi_room_name || generateJitsiRoomName(b.id);
    return {
      ...b,
      jitsi_room_name: roomName,
      jitsi_url: b.meeting_link || getJitsiMeetUrl(roomName),
      start_time: startTime,
      end_time: b.availability_slots?.end_time,
    };
  });

  const upcoming = sessions.filter(
    (s: any) =>
      s.start_time &&
      new Date(s.start_time) > new Date(now) &&
      s.status !== 'cancelled'
  );

  const past = sessions.filter(
    (s: any) =>
      !s.start_time ||
      new Date(s.start_time) <= new Date(now) ||
      s.status === 'completed' ||
      s.status === 'cancelled'
  );

  return NextResponse.json({ upcoming, past });
}

// PATCH /api/sessions - Update session notes or rating/feedback
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { bookingId, feedback_score, feedback_comment } = body;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  // Validate rating
  if (feedback_score !== undefined && (feedback_score < 1 || feedback_score > 5)) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (feedback_score !== undefined) updatePayload.feedback_score = feedback_score;
  if (feedback_comment !== undefined) updatePayload.feedback_comment = feedback_comment;

  const { data, error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, booking: data });
}
