import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin'; // Use admin for cron to bypass typical RLS filters
import { sendBookingConfirmationEmail } from '@/lib/email';

/**
 * GET /api/cron/reminders
 * Trigger this via an external cron service every 15 minutes.
 * Finds upcoming sessions (within 30-45 mins) and alerts participants.
 */
export async function GET(req: NextRequest) {
  // Simple auth check via secret header
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  
  const now = new Date();
  const thirtyMinsLater = new Date(now.getTime() + 30 * 60 * 1000);
  const fortyFiveMinsLater = new Date(now.getTime() + 45 * 60 * 1000);

  try {
    // 1. Find upcoming bookings starting between 30 and 45 mins from now
    const { data: bookings, error } = await supabase
      .from('mentor_bookings')
      .select(`
        *,
        mentor_slots!inner(start_time),
        mentor:profiles!mentor_id(id, full_name, email),
        student:profiles!student_id(id, full_name, email)
      `)
      .eq('status', 'confirmed')
      .gte('mentor_slots.start_time', thirtyMinsLater.toISOString())
      .lte('mentor_slots.start_time', fortyFiveMinsLater.toISOString());

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
        return NextResponse.json({ success: true, message: 'No upcoming sessions found for reminder window' });
    }

    const results = [];

    for (const booking of bookings) {
      // 2. Check if reminder already sent to prevent spam
      const reminderKey = `reminder:${booking.id}`;
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.student_id)
        .eq('type', 'session_reminder')
        .eq('link', `/mentorship/session/${booking.id}`)
        .maybeSingle();

      if (!existing) {
        // 3. Create notifications for Student and Mentor
        const notifyTasks = [
          // To Student
          supabase.from('notifications').insert({
            user_id: booking.student_id,
            type: 'session_reminder',
            title: 'Session Starting Soon!',
            message: `Your session with ${booking.mentor.full_name} starts in ~30 minutes.`,
            link: `/mentorship/session/${booking.id}`
          }),
          // To Mentor
          supabase.from('notifications').insert({
            user_id: booking.mentor_id,
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `Your mentorship session with ${booking.student.full_name} starts in ~30 minutes.`,
            link: `/mentorship/session/${booking.id}`
          })
        ];

        // 4. Send Emails
        const emailTasks = [
          sendBookingConfirmationEmail({
            to: booking.student.email,
            subject: '🔔 STARTING SOON: Your Mentorship Session',
            userName: booking.student.full_name,
            mentorName: booking.mentor.full_name,
            sessionTime: new Date(booking.mentor_slots.start_time).toLocaleString(),
            meetingLink: booking.meeting_link || '',
            isReminder: true // We'll add this flag to the template logic
          }),
          sendBookingConfirmationEmail({
            to: booking.mentor.email,
            subject: '🔔 SESSION ALERT: 30 Minutes to Sync',
            userName: booking.mentor.full_name,
            studentName: booking.student.full_name,
            sessionTime: new Date(booking.mentor_slots.start_time).toLocaleString(),
            meetingLink: booking.meeting_link || '',
            isReminder: true
          })
        ];
        
        await Promise.all([...notifyTasks, ...emailTasks]);
        results.push(booking.id);
      }
    }

    return NextResponse.json({ success: true, reminded_bookings: results });
  } catch (err: any) {
    console.error('[CRON Reminders] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
