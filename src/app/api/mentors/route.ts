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
    // ── Stage 1: id-as-FK schema (phase5) + status filter ───────────────────
    // mentor_profiles.id IS the user's UUID, so `profiles!inner` joins on that.
    // The `.or` filter only works after migration 037 adds those columns.
    const buildFilters = (q: any) => {
      if (specialty) q = q.ilike('specialty', `%${specialty}%`);
      if (branch)    q = q.eq('profiles.branch', branch);
      if (isFree === 'true') q = q.eq('is_free_session_available', true);
      if (minRating) q = q.gte('rating', parseFloat(minRating));
      return q.order('rating', { ascending: false });
    };

    let q1 = buildFilters(
      supabase
        .from('mentor_profiles')
        .select('*, profiles!inner(username, avatar_url, full_name, branch, college)')
        .or('is_verified.eq.true,verification_status.eq.approved')
    );
    const { data: d1, error: e1 } = await q1;

    if (!e1) return NextResponse.json(d1 ?? []);

    console.warn('[GET /api/mentors] stage-1 failed:', e1.message);

    // ── Stage 2: user_id-as-FK schema (001) + status filter ─────────────────
    let q2 = buildFilters(
      supabase
        .from('mentor_profiles')
        .select('*, profiles:user_id(username, avatar_url, full_name, branch, college)')
        .or('is_verified.eq.true,verification_status.eq.approved')
    );
    const { data: d2, error: e2 } = await q2;

    if (!e2) return NextResponse.json(d2 ?? []);

    console.warn('[GET /api/mentors] stage-2 failed:', e2.message);

    // ── Stage 3: No status filter (pre-migration fallback) ───────────────────
    // If the is_verified / verification_status columns don't exist yet, show
    // all mentor_profiles so approved mentors are at least visible.
    // Migration 037 should be run to fix this permanently.
    let q3 = buildFilters(
      supabase
        .from('mentor_profiles')
        .select('*, profiles!inner(username, avatar_url, full_name, branch, college)')
    );
    const { data: d3, error: e3 } = await q3;

    if (!e3) return NextResponse.json(d3 ?? []);

    // ── Stage 4: Absolute last resort — no join, no filter ──────────────────
    console.error('[GET /api/mentors] stage-3 failed:', e3.message);
    const { data: d4 } = await supabase
      .from('mentor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json(d4 ?? []);

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
