import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Get followed mentor IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', user.id);

    const followedIds = follows?.map(f => f.followed_id) || [];

    if (followedIds.length === 0) return NextResponse.json([]);

    // 2. Get upcoming slots for these mentors
    const { data: slots, error } = await supabase
      .from('mentor_slots')
      .select(`
        *,
        mentor_profiles(*),
        profiles(username, avatar_url)
      `)
      .in('mentor_id', followedIds)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    // 3. Mark as "live" if within current window (simple mock for now: actual live status can be time-based)
    const now = new Date();
    const processedSlots = slots.map(slot => {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        return {
            ...slot,
            is_live: now >= start && now <= end
        };
    });

    return NextResponse.json(processedSlots);
  } catch (error: any) {
    console.error('Followed Sessions Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
