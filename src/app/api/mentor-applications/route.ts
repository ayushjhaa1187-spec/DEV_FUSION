import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

const applicationSchema = z.object({
  expertise: z.array(z.string().min(1)).min(1),
  years_experience: z.number().int().min(0).max(50),
  bio: z.string().min(20).max(1000),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  sample_work_url: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = applicationSchema.parse(body);

    // Check for existing pending or approved applications
    const { data: existing } = await supabase
      .from('mentor_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      const message = existing.status === 'approved' 
        ? 'You are already a mentor.' 
        : 'You already have a pending application.';
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('mentor_applications')
      .insert({
        user_id: user.id,
        ...validated,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const { data, error } = await supabase
    .from('mentor_applications')
    .select('*, profiles:user_id(username, full_name, avatar_url)')
    .eq('status', status)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
