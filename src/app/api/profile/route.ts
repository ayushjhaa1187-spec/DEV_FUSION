import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // 2. Fetch Stats
    const { count: answerCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    const { count: acceptedCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('is_accepted', true);

    const { count: doubtCount } = await supabase
      .from('doubts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    // 3. Fetch Reputation History
    const { data: history } = await supabase
      .from('reputation_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile,
      stats: {
        answers: answerCount || 0,
        accepted: acceptedCount || 0,
        doubts: doubtCount || 0
      },
      history: history || []
    });
  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
