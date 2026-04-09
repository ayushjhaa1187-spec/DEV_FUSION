import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generateJitsiRoomName, getJitsiMeetUrl } from '@/lib/jitsi';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const supabase = await createSupabaseServer();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the booking
  const { data: booking, error: fetchError } = await supabase
    .from('mentor_bookings')
    .select('*, mentor_slots(start_time, mentor_id)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Only the mentor or admin can confirm
  const mentorProfileId = booking.mentor_id;
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('user_id')
    .eq('id', mentorProfileId)
    .single();

  if (!mentorProfile || mentorProfile.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'confirmed') {
    // Already confirmed — just return existing data
    const roomName = booking.jitsi_room_name || generateJitsiRoomName(bookingId);
    return NextResponse.json({
      success: true,
      booking,
      roomName,
      jitsiUrl: getJitsiMeetUrl(roomName),
    });
  }

  // Generate deterministic Jitsi room name
  const roomName = generateJitsiRoomName(bookingId);
  const jitsiUrl = getJitsiMeetUrl(roomName);

  // Update booking to confirmed with jitsi_room_name
  const { data: updatedBooking, error: updateError } = await supabase
    .from('mentor_bookings')
    .update({
      status: 'confirmed',
      jitsi_room_name: roomName,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notify student
  await supabase.from('notifications').insert({
    user_id: booking.student_id,
    title: 'Session Confirmed!',
    message: `Your mentorship session has been confirmed. Join via Jitsi: ${jitsiUrl}`,
    type: 'booking_confirmed',
    link: `/sessions/${bookingId}`,
  });

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    roomName,
    jitsiUrl,
  });
}

// GET: Return session details with jitsi URL for a booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from('mentor_bookings')
    .select(
      `*,
      mentor_slots(start_time, end_time),
      mentor_profiles:mentor_id(id, user_id, subjects, hourly_rate,
        profiles:user_id(full_name, avatar_url, username))
      `
    )
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // RLS: only student or mentor can access
  const mentorUserId = (booking.mentor_profiles as any)?.user_id;
  if (booking.student_id !== user.id && mentorUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roomName =
    booking.jitsi_room_name || generateJitsiRoomName(bookingId);

  return NextResponse.json({
    booking,
    roomName,
    jitsiUrl: getJitsiMeetUrl(roomName),
  });
}
