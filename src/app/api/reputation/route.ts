import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = parseInt(searchParams.get('limit')  || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // reputation_history is the canonical table (reputation_events was dropped in migration 014/041)
  const { data, error, count } = await supabase
    .from('reputation_history')
    .select('id, event_type, points_awarded, reference_id, metadata, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data, total: count });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Recalculate total from the source-of-truth table and sync to profile
  const { data: history, error: historyError } = await supabase
    .from('reputation_history')
    .select('points_awarded')
    .eq('user_id', user.id);

  if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });

  const totalPoints = (history || []).reduce((sum, row) => sum + (row.points_awarded || 0), 0);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ reputation_points: totalPoints })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Auto-award any threshold-based badges the user now qualifies for
  const { data: allBadges } = await supabase
    .from('badges')
    .select('id, name, criteria_value')
    .eq('criteria_type', 'reputation_points')
    .lte('criteria_value', totalPoints);

  if (allBadges?.length) {
    await supabase.from('user_badges').upsert(
      allBadges.map((b) => ({ user_id: user.id, badge_id: b.id })),
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ success: true, newReputation: totalPoints });
}
