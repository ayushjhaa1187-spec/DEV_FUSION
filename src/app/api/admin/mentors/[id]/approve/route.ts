import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

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

    // 2. Update Application Status
    const { error: appError } = await supabase
      .from('mentor_applications')
      .update({ status })
      .eq('user_id', id);

    if (appError) throw appError;

    // 3. If approved, update profile role to 'mentor'
    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({ role: 'mentor' })
        .eq('id', id);

      // Notify User
      await supabase.from('notifications').insert({
        user_id: id,
        title: 'Application Approved! 🎉',
        message: 'Congratulations, you are now a verified mentor on SkillBridge.',
        type: 'badge_earned',
        link: '/mentors/profile'
      });
    }

    // 4. Audit log: mentor_approved or mentor_rejected
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
