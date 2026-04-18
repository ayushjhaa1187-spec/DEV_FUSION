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
    const body = await req.json();
    const { slot_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!slot_id) {
       return NextResponse.json({ success: false, error: 'Missing slot_id' }, { status: 400 });
    }

    // 1. Atomically verify and lock the slot to prevent double-booking race conditions
    const { data: slot, error: lockError } = await supabase
      .from('availability_slots')
      .update({ status: 'booked' })
      .eq('id', slot_id)
      .eq('status', 'available')
      .select('mentor_id, start_time')
      .single();

    if (lockError || !slot) {
      return NextResponse.json({ success: false, error: 'Slot is already booked or unavailable' }, { status: 400 });
    }

    // 2. Fetch mentor price to determine if it's a free session
    const { data: mentor } = await supabase
      .from('mentor_profiles')
      .select('hourly_rate, is_free_session_available')
      .eq('id', slot.mentor_id)
      .single();

    const isFree = !mentor || mentor.hourly_rate === 0 || mentor.is_free_session_available;

    // 3. Create booking (Pending if paid, Confirmed if free)
    const jitsiRoomName = generateJitsiRoomName(`${slot_id}-${user.id}-${Date.now()}`);
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: isFree ? 'confirmed' : 'pending', 
        jitsi_room_name: jitsiRoomName,
        meeting_link: getJitsiMeetUrl(jitsiRoomName),
        amount: isFree ? 0 : (mentor?.hourly_rate || 0)
        // Note: transactions should be handled separately and linked via transaction_id
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 4. Log notification for Mentor (Only if confirmed immediately)
    if (isFree) {
      await supabase.from('notifications').insert({
          user_id: slot.mentor_id,
          type: 'session_booked',
          title: 'New Session Booked',
          message: `A student has booked your slot for ${new Date(slot.start_time).toLocaleString()}`,
          link: `/mentors/dashboard`
      });
    }

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
    .from('bookings')
    .select(`
      *,
      mentor:mentor_id (
        id,
        profiles!inner (username, full_name, avatar_url)
      ),
      student:student_id (username, full_name, avatar_url),
      slot:slot_id (start_time, end_time)
    `)
    .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
