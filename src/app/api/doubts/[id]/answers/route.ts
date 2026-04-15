import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const AnswerSchema = z.object({
  content_markdown: z.string().min(10).max(5000),
});

/**
 * /api/doubts/[id]/answers
 * Handles community answers for a specific doubt.
 * Reputation for posting/accepting is handled by API calls (Migration 025/026).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('answers')
    .select('*, profiles(username, avatar_url, reputation_points)')
    .eq('doubt_id', id)
    .order('is_accepted', { ascending: false })
    .order('votes', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const parsed = AnswerSchema.parse(raw);

    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        doubt_id: id,
        author_id: user.id,
        content: parsed.content_markdown,
        content_markdown: parsed.content_markdown,
      })
      .select(`
        *,
        profiles:author_id (username, avatar_url, reputation_points)
      `)
      .single();

    if (error) throw error;

    // 2. Award Reputation (Action Key synced to CASE 'post_answer')
    await supabase.rpc('update_reputation', {
      p_user_id: user.id,
      p_action: 'post_answer',
      p_entity_id: answer.id
    });

    // ─── Notification Flow ──────────────────────────────────────────────────────
    // Notify the doubt author (triggered only if not the same person)
    const { data: doubt } = await supabase
      .from('doubts')
      .select('author_id, title')
      .eq('id', id)
      .single();

    if (doubt && doubt.author_id !== user.id) {
       await supabase.from('notifications').insert({
        user_id: doubt.author_id,
        type: 'answer_posted',
        title: 'New Answer Received',
        message: `Someone answered your doubt: "${doubt.title.slice(0, 30)}..."`,
        link: `/doubts/${id}`
      });
    }

    return NextResponse.json({ success: true, data: answer }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/doubts/ans] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit answer' }, { status: 500 });
  }
}
