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
  availability_type: z.enum(['weekdays', 'weekends']).default('weekdays'),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = applicationSchema.parse(body);

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

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin and profile data fetching
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Get application details before updating
  const { data: app, error: appErr } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (appErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Update application status
  const { error: updateErr } = await supabase
    .from('mentor_applications')
    .update({ status })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (status === 'approved') {
    // 1. Update user role in profiles
    const { error: roleErr } = await supabase
      .from('profiles')
      .update({ role: 'mentor' })
      .eq('id', app.user_id);

    if (roleErr) console.error('Error updating role:', roleErr);

    // 2. Create entry in mentor_profiles table
    const { error: mentorErr } = await supabase
      .from('mentor_profiles')
      .upsert({
        id: app.user_id,
        specialty: app.expertise?.[0] || 'Expert',
        bio: app.bio,
        linkedin_url: app.linkedin_url,
        github_url: app.github_url,
        availability: app.availability_type || 'weekdays',
        is_verified: true
      });

    if (mentorErr) console.error('Error creating mentor profile:', mentorErr);

    // 3. Notify user
    await supabase.from('notifications').insert({
      user_id: app.user_id,
      type: 'mentor_approved',
      message: 'Congratulations! Your mentor application has been approved. You now have access to mentor features.',
      link: '/dashboard'
    });
  } else {
    // Notify user of rejection
    await supabase.from('notifications').insert({
      user_id: app.user_id,
      type: 'mentor_rejected',
      message: 'Your mentor application was not approved at this time. Feel free to re-apply after gaining more experience.',
      link: '/mentors/apply'
    });
  }

  return NextResponse.json({ success: true });
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
  const statusFilter = searchParams.get('status') || 'pending';

  const { data, error } = await supabase
    .from('mentor_applications')
    .select('*, profiles:user_id(username, full_name, avatar_url)')
    .eq('status', statusFilter)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
