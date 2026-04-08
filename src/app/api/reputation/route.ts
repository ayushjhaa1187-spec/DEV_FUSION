import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = parseInt(searchParams.get('limit')  || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { data, error, count } = await supabase
    .from('reputation_events')
    .select('*', { count: 'exact' })
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

  const { data: events, error: eventError } = await supabase
    .from('reputation_events')
    .select('type, count')
    .eq('user_id', user.id);

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const { calculateReputation } = await import('@/lib/reputation');
  const totalPoints = calculateReputation(events || []);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ reputation_points: totalPoints })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { BADGE_THRESHOLDS } = await import('@/lib/reputation');
  for (const t of BADGE_THRESHOLDS) {
    if (totalPoints >= t.min) {
      const { data: badge } = await supabase.from('badges').select('id').eq('name', t.badge).single();
      if (badge) {
        await supabase.from('user_badges').upsert({ user_id: user.id, badge_id: badge.id });
      }
    }
  }

  return NextResponse.json({ success: true, newReputation: totalPoints });
}
