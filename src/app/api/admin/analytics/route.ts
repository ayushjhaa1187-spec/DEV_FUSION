import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    // Collect stats
    const [
      { count: totalUsers },
      { count: totalDoubts },
      { count: totalSessions },
      { data: popularSubjects },
      { data: topMentors }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('doubts').select('*', { count: 'exact', head: true }),
      supabase.from('mentor_bookings').select('*', { count: 'exact', head: true }),
      supabase.rpc('get_popular_subjects'), // Need to define this RPC or use a query
      supabase.from('mentor_profiles').select('*, profiles(username, avatar_url)').order('sessions_completed', { ascending: false }).limit(5)
    ]);

    // Fallback for popular subjects if RPC fails
    let subjects = popularSubjects;
    if (!subjects) {
      const { data } = await supabase.from('doubts_with_stats').select('subject_name').limit(10);
      // Simple aggregation in JS if needed
      subjects = data; 
    }

    return NextResponse.json({
      stats: {
        users: totalUsers,
        doubts: totalDoubts,
        sessions: totalSessions,
      },
      popularSubjects: subjects,
      topMentors
    });
  } catch (err: any) {
    console.error('Analytics Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
