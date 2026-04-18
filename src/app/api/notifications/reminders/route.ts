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
      // Only remind if it's within the window AND hasn't started yet
      return startTime > now && startTime <= thirtyMinutesFromNow;
    }) || [];

    // 2. Insert notifications for each participant (Student & Mentor)
    const results = await Promise.all(toRemind.map(async (booking) => {
      const sessionLink = `/sessions/${booking.id}`;
      const startTimeStr = new Date(booking.mentor_slots.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const prepareNotification = async (userId: string, targetType: 'student' | 'mentor') => {
         // Check if already reminded for this specific session link
         const { data: existing } = await supabase
           .from('notifications')
           .select('id')
           .eq('user_id', userId)
           .eq('type', 'session_reminder')
           .eq('link', sessionLink)
           .maybeSingle();
         
         if (existing) return { userId, status: 'already_reminded' };

         const title = targetType === 'mentor' ? 'Mentorship Session Soon' : 'Session Reminder';
         const message = targetType === 'mentor' 
            ? `Reminder: Your mentorship session with a student starts at ${startTimeStr}.` 
            : `Your session starts at ${startTimeStr}. Get ready!`;

         await supabase.from('notifications').insert({
           user_id: userId,
           title,
           message,
           type: 'session_reminder',
           link: sessionLink
         });

         return { userId, status: 'reminded' };
      };

      const [studentRes, mentorRes] = await Promise.all([
        prepareNotification(booking.student_id, 'student'),
        prepareNotification(booking.mentor_id, 'mentor')
      ]);

      return { bookingId: booking.id, studentRes, mentorRes };
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
