import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // Optional: Verify a cron secret to prevent abuse
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return ...

  const supabase = await createSupabaseServer();

  // 1. Find doubts that need escalation (using our new view)
  const { data: escalable, error } = await supabase
    .from('escalable_doubts')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!escalable || escalable.length === 0) {
    return NextResponse.json({ message: 'No doubts pending escalation' });
  }

  const results = [];

  for (const doubt of escalable) {
    // 2. Update status to 'requested'
    const { error: updateError } = await supabase
      .from('doubts')
      .update({ escalation_status: 'requested' })
      .eq('id', doubt.id);

    if (updateError) continue;

    // 3. Find mentors in the relevant subject
    const { data: mentors } = await supabase
      .from('mentor_profiles')
      .select(`
        user_id,
        profiles!inner(email, full_name)
      `)
      .contains('subjects', [doubt.subject_name]);

    if (mentors && mentors.length > 0) {
      // 4. Send email notifications
      for (const mentor of mentors) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'SkillBridge <notifications@skillbridge.edu>',
            to: (mentor.profiles as any).email,
            subject: `🚨 Priority Escalation: ${doubt.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366f1;">Priority Doubt Escalation</h2>
                <p>Hello <strong>${(mentor.profiles as any).full_name}</strong>,</p>
                <p>A doubt on SkillBridge has remained unresolved for over 24 hours and has been automatically escalated for expert review.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                  <h3 style="margin-top: 0;">${doubt.title}</h3>
                  <p style="color: #64748b; font-size: 14px;">Subject: ${doubt.subject_name}</p>
                  <p>${doubt.content.substring(0, 200)}...</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/doubts/${doubt.id}" 
                   style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  View & Resolve Doubt
                </a>
                <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
                  You received this because you are a registered mentor for ${doubt.subject_name}.
                </p>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Failed to send escalation email:', emailErr);
        }
      }

      // 5. In-app notification for mentors
      const notifications = mentors.map(m => ({
        user_id: m.user_id,
        title: '🚨 Priority Escalation',
        message: `Expert help needed for: ${doubt.title}`,
        type: 'escalation_requested',
        link: `/doubts/${doubt.id}`
      }));

      await supabase.from('notifications').insert(notifications);
    }

    results.push({ id: doubt.id, status: 'escalated', mentors_notified: mentors?.length || 0 });
  }

  return NextResponse.json({ success: true, processed: results });
}
