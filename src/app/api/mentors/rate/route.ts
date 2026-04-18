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

    // 1. Verify the booking belongs to this user
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('student_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || booking.student_id !== user.id) {
      return NextResponse.json({ error: 'Invalid booking' }, { status: 403 });
    }

    // 2. Update the booking with feedback
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        feedback_score: rating,
        feedback_comment: review,
        status: 'completed'
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
