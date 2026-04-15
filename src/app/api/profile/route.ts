import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [
      { data: profile, error: profileError },
      { count: answers },
      { count: accepted },
      { count: doubts },
      { data: history },
      { data: badges }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('answers').select('*', { count: 'exact', head: true })
        .eq('author_id', user.id),
      supabase.from('answers').select('*', { count: 'exact', head: true })
        .eq('author_id', user.id).eq('is_accepted', true),
      supabase.from('doubts').select('*', { count: 'exact', head: true })
        .eq('author_id', user.id),
      // Use the canonical reputation_history table
      supabase.from('reputation_history').select('action, points, entity_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('user_badges')
        .select('*, badges(name, description, icon)')
        .eq('user_id', user.id)
    ]);

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: {
        profile,
        stats: {
          answers: answers || 0,
          accepted: accepted || 0,
          doubts: doubts || 0
        },
        history: (history || []).map((h: any) => ({
          event_type: h.action,
          points: h.points,
          entity_id: h.entity_id,
          created_at: h.created_at
        })),
        badges: (badges || []).map((ub: any) => ({ ...ub.badges, earned_at: ub.unlocked_at }))
      }
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // Whitelist updatable fields
    const allowed: Record<string, unknown> = {};
    const updatableFields = [
      'full_name', 'bio', 'college', 'branch', 'semester',
      'github_url', 'linkedin_url', 'website_url', 'avatar_url',
      'twitter_url', 'recruitment_opt_in', 'subjects'
    ];
    for (const field of updatableFields) {
      if (field in body) allowed[field] = body[field];
    }
    allowed.updated_at = new Date().toISOString();

    // Validate semester range
    if (allowed.semester !== undefined) {
      const sem = Number(allowed.semester);
      if (isNaN(sem) || sem < 1 || sem > 8) {
        return NextResponse.json({ error: 'semester must be 1-8' }, { status: 400 });
      }
      allowed.semester = sem;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
