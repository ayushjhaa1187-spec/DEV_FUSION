import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const MentorUpdateSchema = z.object({
  specialty: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  linkedin_url: z.string().url().or(z.literal('')).optional(),
  github_url: z.string().url().or(z.literal('')).optional(),
  hourly_rate: z.number().min(0).max(500), // Enforce ₹0-₹500 constraint
  is_free_session_available: z.boolean().optional(),
});

/**
 * PATCH /api/mentors/profile
 * Updates the mentor's specific profile data.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = MentorUpdateSchema.parse(body);

    // Verify user is actually a mentor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'mentor') {
      return NextResponse.json({ success: false, error: 'Access denied: Mentor role required' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('mentor_profiles')
      .update({
        ...parsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[PATCH /api/mentors/profile] Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof z.ZodError ? 'Validation failed: Fee must be between ₹0 and ₹500' : error.message 
    }, { status: 400 });
  }
}

/**
 * GET /api/mentors/profile
 * Fetches the current user's mentor specific profile data.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ success: false, error: 'Mentor profile not found' }, { status: 404 });

  return NextResponse.json({ success: true, data });
}
