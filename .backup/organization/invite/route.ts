import { createSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'organization' && user.user_metadata?.role !== 'campus_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, role = 'student' } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Get organization ID for this admin
  const { data: orgMember } = await supabase
    .from('campus_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!orgMember) {
    return NextResponse.json({ error: 'Organization mapping not found' }, { status: 404 });
  }

  // Check if invitation already exists
  const { data: existing } = await supabase
    .from('campus_invitations')
    .select('id')
    .eq('email', email)
    .eq('org_id', orgMember.org_id)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Invitation already pending for this email' }, { status: 400 });
  }

  // Create invitation
  const { data, error } = await supabase
    .from('campus_invitations')
    .insert([{
      org_id: orgMember.org_id,
      email,
      role,
      invited_by: user.id
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // In a real app, you would send an email here using Resend or similar
  // For now, we return success and the link
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/join-campus?token=${data.id}`;

  return NextResponse.json({ 
    success: true, 
    invitation: data,
    link: invitationLink // In dev, we show the link
  });
}
