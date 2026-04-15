import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // 1. Fetch Daily Activity for Heatmap (365 Days)
    const { data: log, error: logError } = await supabase
      .from('daily_activity_log')
      .select('activity_date, actions_count')
      .eq('student_id', user.id)
      .gte('activity_date', oneYearAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: true });

    if (logError) throw logError;

    // 2. Calculate Momentum Pulse (Rolling 7d vs Prior 7d)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const { data: momentumData, error: momError } = await supabase
      .from('daily_activity_log')
      .select('activity_date, actions_count')
      .eq('student_id', user.id)
      .gte('activity_date', fourteenDaysAgo.toISOString().split('T')[0]);

    if (momError) throw momError;

    const currentPeriod = momentumData
      ?.filter(d => new Date(d.activity_date) >= sevenDaysAgo)
      .reduce((acc, d) => acc + d.actions_count, 0) || 0;

    const priorPeriod = momentumData
      ?.filter(d => new Date(d.activity_date) < sevenDaysAgo)
      .reduce((acc, d) => acc + d.actions_count, 0) || 0;

    const momentum = priorPeriod === 0 
      ? (currentPeriod > 0 ? 100 : 0) 
      : Math.round(((currentPeriod - priorPeriod) / priorPeriod) * 100);

    return NextResponse.json({
      success: true,
      heatmap: log || [],
      momentum: {
        value: momentum,
        current_actions: currentPeriod,
        prior_actions: priorPeriod
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
