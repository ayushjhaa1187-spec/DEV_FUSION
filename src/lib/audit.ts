import { createAdminClient } from './supabase/admin';

export type AuditAction =
  | 'doubt_created' | 'doubt_deleted' | 'answer_accepted'
  | 'booking_confirmed' | 'payment_verified'
  | 'mentor_approved' | 'mentor_rejected'
  | 'user_banned' | 'content_moderated';

export async function logAuditEvent(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // Audit log failure should never block the main operation
    console.error('[AUDIT LOG FAILED]', e);
  }
}
