import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// We use the admin service role because cron hits this anonymously
export async function GET(req: NextRequest) {
    // 1. Verify Authorization (Vercel Cron Secret or custom secret)
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    
    // In dev environment or if secret matches
    if (secret && authHeader !== `Bearer ${secret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // Calculate time bounds: between now+29m and now+30m
        const now = new Date();
        const minTime = new Date(now.getTime() + 29 * 60000).toISOString();
        const maxTime = new Date(now.getTime() + 30 * 60000).toISOString();

        // Query bookings that are about to start
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                id,
                start_timestamp,
                student_id,
                slots (
                    mentor_id
                )
            `)
            .in('status', ['COMPLETED', 'FREE'])
            .gte('start_timestamp', minTime)
            .lte('start_timestamp', maxTime);

        if (bookingsError) {
            console.error('Failed to fetch bookings:', bookingsError);
            throw bookingsError;
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ success: true, message: 'No upcoming sessions found.' });
        }

        const notificationsToInsert: any[] = [];

        bookings.forEach((b: any) => {
            const studentId = b.student_id;
            const mentorId = b.slots?.mentor_id;
            const timeStr = new Date(b.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Notify Student
            if (studentId) {
                notificationsToInsert.push({
                    user_id: studentId,
                    type: 'SESSION_REMINDER',
                    message: `Reminder: Your mentorship session starts at ${timeStr}. Check your dashboard for the exact link.`,
                    reference_id: b.id
                });
            }

            // Notify Mentor
            if (mentorId) {
                notificationsToInsert.push({
                    user_id: mentorId,
                    type: 'SESSION_REMINDER',
                    message: `Alert: You have a mentorship session starting at ${timeStr}. Ensure your environment is ready.`,
                    reference_id: b.id
                });
            }
        });

        // Bulk insert notifications
        if (notificationsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notificationsToInsert);

            if (insertError) throw insertError;
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${bookings.length} upcoming booking(s). Dispatched ${notificationsToInsert.length} notifications.` 
        });

    } catch (err: any) {
        console.error('CRON processing failed:', err);
        return NextResponse.json({ success: false, error: 'Failed to process reminders' }, { status: 500 });
    }
}
