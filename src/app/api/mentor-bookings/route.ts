import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generateJitsiRoomName, getJitsiMeetUrl } from '@/lib/jitsi';

/**
 * /api/mentor-bookings
 * Lean MVP simplified booking flow.
 * Removes Razorpay payment dependency for streamlined mentorship.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slot_id } = await req.json();

    if (!slot_id) {
       return NextResponse.json({ success: false, error: 'Missing slot_id' }, { status: 400 });
    }

    // 1. Atomically verify and lock the slot to prevent double-booking race conditions
    const { data: slot, error: lockError } = await supabase
      .from('mentor_slots')
      .update({ status: 'booked' })
      .eq('id', slot_id)
      .eq('status', 'available')
      .select('mentor_id, start_time')
      .single();

    if (lockError || !slot) {
      return NextResponse.json({ success: false, error: 'Slot is already booked or unavailable' }, { status: 400 });
    }

    // 2. Create simplified booking
    const jitsiRoomName = generateJitsiRoomName(`${slot_id}-${user.id}-${Date.now()}`);
    
    const { data: booking, error: bookingError } = await supabase
      .from('mentor_bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: 'confirmed', 
        jitsi_room_name: jitsiRoomName,
        meeting_link: getJitsiMeetUrl(jitsiRoomName),
        payment_status: 'free',
        amount_paid: 0
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3. (Slot already marked as booked atomically in step 1)

    // 4. Log notification for Mentor (In-App)
    await supabase.from('notifications').insert({
        user_id: slot.mentor_id,
        type: 'session_booked',
        title: 'New Session Booked',
        message: `A student has booked your slot for ${new Date(slot.start_time).toLocaleString()}`,
        link: `/mentors/dashboard`
    });

    return NextResponse.json({ success: true, data: booking });

  } catch (error: any) {
    console.error('[POST /api/mentor-bookings] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process booking' }, { status: 500 });
  }
}

/**
 * GET /api/mentor-bookings
 * Returns current user's bookings (both as student and mentor).
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('mentor_bookings')
    .select(`
      *,
      mentor:profiles!mentor_id (username, full_name, avatar_url),
      student:profiles!student_id (username, full_name, avatar_url),
      slot:mentor_slots (start_time, end_time)
    `)
    .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
