import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');
  const branch = searchParams.get('branch');
  const isFree = searchParams.get('is_free');
  const minRating = searchParams.get('min_rating');

  try {
    let query = supabase
      .from('mentor_profiles')
      .select('*, profiles!user_id(username, avatar_url, full_name, branch, college)')
      .eq('verification_status', 'approved');

    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    if (isFree === 'true') query = query.eq('is_free_session_available', true);
    if (minRating) query = query.gte('rating_avg', parseFloat(minRating));

    query = query.order('rating_avg', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/mentors] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { headline, bio, specialty, subjects, hourly_rate, is_free_session_available } = await req.json();

    // Check if mentor profile already exists
    const { data: existing } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Mentor profile already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('mentor_profiles')
      .insert({
        user_id: user.id,
        headline,
        bio,
        specialty,
        subjects: subjects || [],
        hourly_rate: hourly_rate || 0,
        is_free_session_available: is_free_session_available || false,
      })
      .select('*, profiles!user_id(username, avatar_url, full_name)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
