import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: snapshots, error } = await supabase
      .from('mastery_snapshots')
      .select('recorded_at, avg_score, subject')
      .eq('student_id', user.id)
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // Aggregate by date (average score across all subjects for a date)
    const aggregated = snapshots?.reduce((acc: any[], current) => {
      const existing = acc.find(a => a.recorded_at === current.recorded_at);
      if (existing) {
        existing.avg_score = (existing.avg_score + current.avg_score) / 2;
      } else {
        acc.push({ ...current });
      }
      return acc;
    }, []) || [];

    return NextResponse.json(aggregated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
