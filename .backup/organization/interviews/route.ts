import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { generateJitsiRoomName } from '@/lib/jitsi';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Check if user is an organization owner
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !org) return NextResponse.json({ error: 'Not an organization owner' }, { status: 403 });

    const { data: interviews, error } = await supabase
      .from('organization_interviews')
      .select(`
        *,
        organization_memberships (
          user_id,
          profiles (full_name, avatar_url, role)
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(interviews);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { membership_id, scheduled_at } = await req.json();

    // Verify ownership of the organization
    const { data: membership, error: memError } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('id', membership_id)
      .single();

    if (memError || !membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', membership.organization_id)
      .eq('owner_id', user.id)
      .single();

    if (orgError || !org) return NextResponse.json({ error: 'Unauthorized organizational action' }, { status: 403 });

    const roomId = generateJitsiRoomName(membership_id);

    const { data, error } = await supabase
      .from('organization_interviews')
      .insert({
        membership_id,
        scheduled_at,
        room_id: roomId,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;

    // Update membership status to 'interviewing'
    await supabase
      .from('organization_memberships')
      .update({ status: 'interviewing' })
      .eq('id', membership_id);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { interview_id, status, notes } = await req.json();

    const { data: interview, error: intError } = await supabase
      .from('organization_interviews')
      .select('*, organization_memberships(organization_id, user_id)')
      .eq('id', interview_id)
      .single();

    if (intError || !interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    // Verify ownership
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', (interview.organization_memberships as any).organization_id)
      .eq('owner_id', user.id)
      .single();

    if (orgError || !org) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { error: updateError } = await supabase
      .from('organization_interviews')
      .update({ status, notes })
      .eq('id', interview_id);

    if (updateError) throw updateError;

    // If approved, finalize mentor affiliation
    if (status === 'completed' && notes?.toLowerCase().includes('approve')) {
      const membership = interview.organization_memberships as any;
      
      // Update membership status
      await supabase
        .from('organization_memberships')
        .update({ status: 'approved' })
        .eq('id', interview.membership_id);

      // Update mentor profile to 'affiliated'
      await supabase
        .from('mentor_profiles')
        .update({ 
          is_affiliated: true, 
          affiliated_org_id: membership.organization_id 
        })
        .eq('id', membership.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
