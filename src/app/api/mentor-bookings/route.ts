import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slot_id } = await req.json();

    // 1. Verify slot is available
    const { data: slot, error: slotError } = await supabase
      .from('mentor_slots')
      .select('mentor_id, is_booked, start_time')
      .eq('id', slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 400 });
    }

    // 2. Create booking as pending
    const { data: booking, error: bookingError } = await supabase
      .from('mentor_bookings')
      .insert({
        student_id: user.id,
        mentor_id: slot.mentor_id,
        slot_id: slot_id,
        status: 'confirmed', 
        meeting_link: 'https://meet.jit.si/' + Math.random().toString(36).substring(7)
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // 3. Mark slot as booked
    await supabase
      .from('mentor_slots')
      .update({ is_booked: true })
      .eq('id', slot_id);

    // 4. Notify mentor
    await supabase
      .from('notifications')
      .insert({
        user_id: slot.mentor_id,
        title: 'New Session Booked!',
        message: `A student has booked a 30-minute session for ${slot.start_time}.`,
        type: 'booking_confirmed',
        link: '/mentors/bookings'
      });

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
