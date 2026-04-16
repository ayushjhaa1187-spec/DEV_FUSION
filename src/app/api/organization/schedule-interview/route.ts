// src/app/api/organization/schedule-interview/route.ts

import { createSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { addHours, startOfDay, format } from 'date-fns';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { studentId, scheduledAt, notes } = await req.json();

    // 1. Verify Organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (!org) return new NextResponse('Forbidden: Not an Organization', { status: 403 });

    // 2. Ensure Membership exists (or create one for the recruiting process)
    let { data: membership } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('organization_id', org.id)
      .eq('user_id', studentId)
      .maybeSingle();

    if (!membership) {
      const { data: newMembership, error: memError } = await supabase
        .from('organization_memberships')
        .insert({
          organization_id: org.id,
          user_id: studentId,
          status: 'pending',
          introduction: `Interview initiated by ${org.name}`
        })
        .select()
        .single();
      
      if (memError) throw memError;
      membership = newMembership;
    }

    // 3. Create Interview
    const roomId = `interview-${org.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`;
    const { data: interview, error: intError } = await supabase
      .from('organization_interviews')
      .insert({
        membership_id: membership.id,
        scheduled_at: scheduledAt,
        room_id: roomId,
        notes: notes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (intError) throw intError;

    // 4. Multi-Stage Notifications (The User's specific requirement)
    const interviewDate = new Date(scheduledAt);
    const notifications = [
      // Notification 1: Immediate Booking
      {
        user_id: studentId,
        type: 'interview_booked',
        title: 'New Interview Scheduled!',
        body: `${org.name} has scheduled an interview with you.`,
        scheduled_for: new Date(),
        is_sent: true,
        entity_type: 'interview',
        entity_id: interview.id
      },
      // Notification 2: Day of Interview
      {
        user_id: studentId,
        type: 'interview_reminder',
        title: 'Interview Today!',
        body: `Reminder: You have an interview with ${org.name} today at ${format(interviewDate, 'p')}.`,
        scheduled_for: startOfDay(interviewDate),
        is_sent: false,
        entity_type: 'interview',
        entity_id: interview.id
      },
      // Notification 3: 1 Hour Before
      {
        user_id: studentId,
        type: 'interview_reminder_final',
        title: 'Interview starting soon',
        body: `Your session with ${org.name} starts in 1 hour. Get ready!`,
        scheduled_for: addHours(interviewDate, -1),
        is_sent: false,
        entity_type: 'interview',
        entity_id: interview.id
      }
    ];

    // Bulk insert notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) console.error('Notification queueing failed:', notifError);

    return NextResponse.json({ success: true, interview });

  } catch (err: any) {
    console.error('Interview schedule error:', err);
    return new NextResponse(err.message || 'Internal Server Error', { status: 500 });
  }
}
