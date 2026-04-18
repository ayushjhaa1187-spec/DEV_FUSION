import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { sendMentorStatusEmail } from '@/lib/email';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Security Check: Only admins can approve mentors
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const { status } = await req.json(); // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 1. Fetch the LATEST application details to handle multiple submissions
    const { data: appData, error: appFetchError } = await supabase
      .from('mentor_applications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appFetchError || !appData) {
      return NextResponse.json({ error: 'Application documentation not found' }, { status: 404 });
    }

    // 2. Update Application Status
    const { error: appError } = await supabase
      .from('mentor_applications')
      .update({ status })
      .eq('user_id', id);

    if (appError) throw appError;

    // 3. If approved, update profile role to 'mentor' and initialize mentor_profile
    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({ role: 'mentor' })
        .eq('id', id);

      // Specialty extraction
      const expertiseArr = typeof appData.expertise === 'string' 
        ? JSON.parse(appData.expertise || '[]') 
        : (appData.expertise || []);
      const specialty = expertiseArr[0] || 'Domain Expert';

      // Initialize/Update mentor profile with data from application.
      // We set BOTH is_verified + verification_status, and BOTH hourly_rate + price_per_session
      // to be compatible with either schema version that may be live in production.
      const upsertPayload: Record<string, unknown> = {
        specialty,
        bio: appData.bio || null,
        linkedin_url: appData.linkedin_url || null,
        github_url: appData.github_url || null,
        availability: appData.availability_type || 'weekdays',
        is_verified: true,
        verification_status: 'approved',
        hourly_rate: 0,
        price_per_session: 0, // Displayed in student-facing /mentors page
        rating: 5.0,
      };

      // Attempt upsert using 'id' as PK (phase5 schema where id IS the user FK)
      const { error: upsertByIdError } = await supabase
        .from('mentor_profiles')
        .upsert({ id, ...upsertPayload }, { onConflict: 'id' });

      if (upsertByIdError) {
        // Fallback: try using user_id column (migration 001 schema)
        console.error('[approve] upsert-by-id failed, trying user_id fallback:', upsertByIdError.message);
        const { error: upsertByUserIdError } = await supabase
          .from('mentor_profiles')
          .upsert({ user_id: id, ...upsertPayload }, { onConflict: 'user_id' });
        if (upsertByUserIdError) {
          console.error('[approve] upsert-by-user_id also failed:', upsertByUserIdError.message);
        }
      }

      // Notify User
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Mentor Application Approved! 🎉',
        message: 'Congratulations, you are now a verified mentor. Your public profile has been initialized.',
        type: 'mentor_approved',
        link: '/mentors/profile'
      });
    }

    // 4. Send Email Notification (Resend)
    const { data: applicantProfile } = await supabase
      .from('profiles')
      .select('email, full_name, username')
      .eq('id', id)
      .single();

    if (applicantProfile?.email) {
      await sendMentorStatusEmail({
        to: applicantProfile.email,
        status: status as 'approved' | 'rejected',
        name: applicantProfile.full_name || applicantProfile.username || 'Mentor'
      });
    }

    // 5. Audit log
    await logAuditEvent(
      user!.id,
      status === 'approved' ? 'mentor_approved' : 'mentor_rejected',
      'mentor_application',
      id,
      { decision: status, admin_id: user!.id }
    );

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
