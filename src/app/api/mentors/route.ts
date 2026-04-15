import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');
  const branch = searchParams.get('branch');
  const isFree = searchParams.get('is_free');
  const minRating = searchParams.get('min_rating');

  try {
    let query = supabase
      .from('mentor_profiles')
      .select('*, profiles!inner(username, avatar_url, full_name, branch, college)');

    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    if (branch) query = query.eq('profiles.branch', branch);
    if (isFree === 'true') query = query.eq('is_free_session_available', true);
    if (minRating) query = query.gte('rating', parseFloat(minRating));

    query = query.order('rating', { ascending: false });

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
    // 1. Role Verification: Only mentors or admins can instantiate profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'mentor' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Only approved mentors can create a profile' }, { status: 403 });
    }

    const { specialty, price_per_session } = await req.json();

    // 2. Check if mentor profile already exists
    const { data: existing } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Mentor profile already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('mentor_profiles')
      .insert({
        id: user.id, // id IS the FK to profiles(id)
        specialty,
        price_per_session: price_per_session || 0,
      })
      .select('*, profiles:id(username, avatar_url, full_name)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
