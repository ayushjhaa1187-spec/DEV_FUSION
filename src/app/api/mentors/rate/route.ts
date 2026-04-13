import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mentorId, bookingId, rating, review } = await req.json();

    if (!mentorId || !bookingId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the booking belongs to this user and is completed
    const { data: booking, error: fetchError } = await supabase
      .from('mentor_bookings')
      .select('student_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || booking.student_id !== user.id) {
      return NextResponse.json({ error: 'Invalid booking' }, { status: 403 });
    }

    // 2. Insert the rating
    const { error: insertError } = await supabase
      .from('mentor_ratings')
      .upsert({
        mentor_id: mentorId,
        student_id: user.id,
        booking_id: bookingId,
        rating,
        review
      }, { onConflict: 'booking_id' });

    if (insertError) throw insertError;

    // 3. Mark booking as completed if it wasn't already
    if (booking.status !== 'completed') {
      await supabase
        .from('mentor_bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
