import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

/**
 * POST /api/admin/moderate
 * Admin route to moderate (hide/remove) content such as doubts, answers, or comments.
 * Body: { entity_type: string, entity_id: string, action: 'hide' | 'remove', reason?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can moderate content
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const { entity_type, entity_id, action, reason } = await req.json();

    if (!entity_type || !entity_id || !action) {
      return NextResponse.json(
        { error: 'entity_type, entity_id, and action are required' },
        { status: 400 }
      );
    }

    if (!['hide', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'action must be hide or remove' }, { status: 400 });
    }

    const table = entity_type === 'doubt' ? 'doubts'
      : entity_type === 'answer' ? 'answers'
      : null;

    if (!table) {
      return NextResponse.json({ error: 'Unsupported entity_type' }, { status: 400 });
    }

    const updatePayload =
      action === 'hide'
        ? { is_hidden: true }
        : { is_deleted: true };

    const { error: updateError } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', entity_id);

    if (updateError) throw updateError;

    // Audit log
    await logAuditEvent(user.id, 'content_moderated', entity_type, entity_id, {
      moderation_action: action,
      reason: reason ?? null,
      admin_id: user.id,
    });

    return NextResponse.json({ success: true, entity_type, entity_id, action });
  } catch (error: any) {
    console.error('[POST /api/admin/moderate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
