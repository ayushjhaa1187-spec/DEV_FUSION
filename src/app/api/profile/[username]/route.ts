import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createSupabaseServer();

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [
      { count: answers },
      { count: accepted },
      { count: doubts },
      { data: badges },
      { data: reputationEvents }
    ] = await Promise.all([
      supabase.from('answers').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
      supabase.from('answers').select('*', { count: 'exact', head: true }).eq('author_id', profile.id).eq('is_accepted', true),
      supabase.from('doubts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
      supabase.from('user_badges').select('*, badges(name, description, icon)').eq('user_id', profile.id),
      supabase.from('reputation_history').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      profile,
      stats: {
        answers: answers || 0,
        accepted: accepted || 0,
        doubts: doubts || 0
      },
      badges: (badges || []).map((ub: any) => ({
        ...ub.badges,
        earned_at: ub.created_at
      })),
      reputationEvents: reputationEvents || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
