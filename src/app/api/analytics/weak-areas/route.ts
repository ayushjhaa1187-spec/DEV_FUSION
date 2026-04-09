import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: attempts } = await supabase
      .from('practice_attempts')
      .select('score, practice_tests(subjects(name, id))')
      .eq('user_id', user.id);

    if (!attempts || attempts.length === 0) return NextResponse.json([]);

    const subjectMap: Record<string, { total: number, count: number, id: string }> = {};
    attempts.forEach((a: any) => {
      const s = a.practice_tests?.subjects;
      if (!s) return;
      if (!subjectMap[s.name]) subjectMap[s.name] = { total: 0, count: 0, id: s.id };
      subjectMap[s.name].total += (a.score || 0);
      subjectMap[s.name].count += 1;
    });

    const analysis = Object.entries(subjectMap)
      .map(([name, stats]) => ({
        name,
        avg: Math.round(stats.total / stats.count),
        id: stats.id
      }))
      .filter(s => s.avg < 80) // Below 80% is the threshold for "needs improvement" in high-performing contexts
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3); // Top 3 weak areas

    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
