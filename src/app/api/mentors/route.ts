import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/mentors
 * Robust multi-schema fallback for mentor fetching.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Try to get user, but allow public access
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');
  const branch = searchParams.get('branch');
  const isFree = searchParams.get('is_free');
  const minRating = searchParams.get('min_rating');

  try {
    const buildFilters = (q: any) => {
      if (specialty) q = q.ilike('specialty', `%${specialty}%`);
      if (branch)    q = q.eq('profiles.branch', branch);
      if (isFree === 'true') q = q.or('is_free_session_available.eq.true,session_fee.eq.0,price_per_session.eq.0');
      if (minRating) q = q.gte('rating', parseFloat(minRating));
      return q.order('rating', { ascending: false });
    };

    // Stage 1: Modern Schema (session_fee + profiles)
    let q1 = buildFilters(
      supabase
        .from('mentor_profiles')
        .select(`
          id, specialty, session_fee, price_per_session, rating, sessions_completed, bio, skills, is_verified, verification_status,
          profiles:id (username, avatar_url, full_name, branch, college)
        `)
        .or('is_verified.eq.true,verification_status.eq.approved')
    );
    const { data: d1, error: e1 } = await q1;

    if (!e1 && d1 && d1.length > 0) {
      return NextResponse.json(d1.map(m => ({ 
        ...m, 
        price_per_session: m.session_fee ?? m.price_per_session ?? 0 
      })));
    }

    if (e1) console.warn('[GET /api/mentors] stage-1 failed:', e1.message);

    // Stage 2: Fallback — show unverified if no verified exist (or RLS issue)
    let q2 = buildFilters(
      supabase
        .from('mentor_profiles')
        .select('*, profiles:id(username, avatar_url, full_name, branch, college)')
    );
    const { data: d2, error: e2 } = await q2;

    if (!e2) {
      return NextResponse.json((d2 ?? []).map(m => ({ 
        ...m, 
        price_per_session: m.session_fee ?? m.price_per_session ?? 0 
      })));
    }

    console.error('[GET /api/mentors] All stages failed:', e2.message);
    return NextResponse.json({ error: e2.message }, { status: 500 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/mentors
 * Creates or updates a mentor profile.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Check permissions (can only create if profile exists)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

    const body = await req.json();
    const { specialty, session_fee, price_per_session, bio, skills } = body;

    // 2. Upsert mentor profile
    const { data, error } = await supabase
      .from('mentor_profiles')
      .upsert({
        id: user.id,
        specialty,
        session_fee: session_fee ?? price_per_session ?? 0,
        price_per_session: session_fee ?? price_per_session ?? 0,
        bio,
        skills,
        updated_at: new Date().toISOString()
      })
      .select('*, profiles:id(username, avatar_url, full_name)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Auto-update user role to mentor if not already
    if (profile.role !== 'mentor' && profile.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'mentor' }).eq('id', user.id);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

