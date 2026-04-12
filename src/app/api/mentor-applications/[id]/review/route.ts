import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user: admin } } = await supabase.auth.getUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', admin.id).single();
  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, admin_notes } = await req.json();
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    // 1. Get the application to find the user_id
    const { data: application, error: fetchError } = await supabase
      .from('mentor_applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { user_id } = application;

    // 2. Perform updates in parallel
    const updates: any[] = [
      // Update application status
      supabase
        .from('mentor_applications')
        .update({
          status,
          admin_notes,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .then(r => r),
      
      // Notify the user
      supabase
        .from('notifications')
        .insert({
          user_id,
          type: status === 'approved' ? 'accepted' : 'info',
          message: status === 'approved' 
            ? 'Congratulations! Your mentor application has been approved. You now have mentor access.' 
            : `Update on your mentor application: It has been ${status}. ${admin_notes ? `Note: ${admin_notes}` : ''}`,
          is_read: false
        })
        .then(r => r)
    ];

    // If approved, update user role
    if (status === 'approved') {
      updates.push(
        supabase
          .from('profiles')
          .update({ role: 'mentor', is_mentor: true })
          .eq('id', user_id)
          .then(r => r)
      );
    }

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });

  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
