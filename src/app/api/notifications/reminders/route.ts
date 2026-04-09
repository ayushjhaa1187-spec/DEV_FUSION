import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Fetch bookings for this student with slot times
    const { data: bookings } = await supabase
      .from('mentor_bookings')
      .select('id, mentor_id, slot_id, mentor_slots(start_time), mentor_profiles(profiles(full_name))')
      .eq('student_id', user.id)
      .eq('status', 'confirmed');

    // Filter in JS for simplicity in this specific GET route
    const upcoming = bookings?.filter((b: any) => {
      const startTime = new Date(b.mentor_slots?.start_time);
      return startTime > now && startTime <= thirtyMinutesFromNow;
    }) || [];

    return NextResponse.json({ 
      upcoming_count: upcoming.length,
      sessions: upcoming,
      check_time: now.toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Poller failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Security check for "cron" (use a secret if this is public)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // 1. Find all confirmed bookings starting in the next 30 minutes
    const { data: upcomingBookings } = await supabase
      .from('mentor_bookings')
      .select('*, mentor_slots(start_time)')
      .eq('status', 'confirmed');

    const toRemind = upcomingBookings?.filter((b: any) => {
      const startTime = new Date(b.mentor_slots?.start_time);
      return startTime > now && startTime <= thirtyMinutesFromNow;
    }) || [];

    // 2. Insert notifications for each
    const results = await Promise.all(toRemind.map(async (booking) => {
      // Check if already reminded (optional but good)
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.student_id)
        .eq('type', 'session_reminder')
        .contains('message', [new Date(booking.mentor_slots.start_time).toLocaleTimeString()])
        .single();
      
      if (existing) return { id: booking.id, status: 'already_reminded' };

      await supabase.from('notifications').insert({
        user_id: booking.student_id,
        title: 'Upcoming Session Reminder!',
        message: `Your session starts at ${new Date(booking.mentor_slots.start_time).toLocaleTimeString()}. Get ready!`,
        type: 'session_reminder',
        link: '/dashboard/sessions'
      });

      return { id: booking.id, status: 'reminded' };
    }));

    return NextResponse.json({ 
      processed: results.length,
      details: results,
      timestamp: now.toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
