import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const [
      { count: totalUsers },
      { count: totalDoubts },
      { count: totalSessions },
      { data: subjectsWithDoubts },
      { data: topMentors },
      { data: testPerformance },
      { data: reportedContent }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('doubts').select('*', { count: 'exact', head: true }),
      supabase.from('mentor_bookings').select('*', { count: 'exact', head: true }),
      supabase.from('doubts').select('subject_id, subjects(name)'),
      supabase.from('mentor_profiles').select('*, profiles(username, avatar_url)').order('sessions_completed', { ascending: false }).limit(5),
      supabase.from('test_results').select('score, subjects(name)'),
      supabase.from('doubts').select('*, profiles(username)').eq('is_reported', true)
    ]);

    // Aggregate in JS for flexibility
    const subjectCounts: Record<string, number> = {};
    subjectsWithDoubts?.forEach((d: any) => {
      const name = d.subjects?.name || 'General';
      subjectCounts[name] = (subjectCounts[name] || 0) + 1;
    });

    const testScores: Record<string, { total: number, count: number }> = {};
    testPerformance?.forEach((t: any) => {
        const name = t.subjects?.name || 'General';
        if (!testScores[name]) testScores[name] = { total: 0, count: 0 };
        testScores[name].total += t.score;
        testScores[name].count += 1;
    });

    return NextResponse.json({
      stats: {
        users: totalUsers,
        doubts: totalDoubts,
        sessions: totalSessions,
      },
      popularSubjects: Object.entries(subjectCounts).map(([name, count]) => ({ subject_name: name, count })),
      testPerformance: Object.entries(testScores).map(([name, val]) => ({ 
          name, 
          avg: Math.round(val.total / val.count) 
      })),
      topMentors,
      reportedContent: reportedContent || []
    });
  } catch (err: any) {
    console.error('Analytics Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
