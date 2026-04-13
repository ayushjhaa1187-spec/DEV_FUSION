import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendOrganizationApplicationEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await req.json();

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Get Applicant Profile
    const { data: profile, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pError) throw pError;

    // 2. Get Organization Email and Requirements
    const { data: org, error: oError } = await supabaseAdmin
      .from('organizations')
      .select('name, owner_id, min_reputation')
      .eq('id', orgId)
      .single();

    if (oError) throw oError;

    // Server-side Reputation Check
    const requiredRep = org.min_reputation || 50;
    if ((profile?.reputation_points || 0) < requiredRep) {
      return NextResponse.json({ 
        error: `Insufficient reputation. This organization requires ${requiredRep} points.` 
      }, { status: 403 });
    }

    const { data: owner, error: owError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', org.owner_id)
      .single();

    // Note: If profile.email is not available in 'profiles' table, we might need to get it from auth.users (requires service role)
    // For this hackathon, we assume the owner's email is either in profiles or we use a fallback.
    // In many Supabase setups, public.profiles matches auth.users email via a trigger.
    
    // 3. Create Membership
    const { error: mError } = await supabaseAdmin
      .from('organization_memberships')
      .insert({
        organization_id: orgId,
        user_id: userId,
        status: 'pending'
      });

    if (mError) {
      if (mError.code === '23505') {
        return NextResponse.json({ error: 'Already applied' }, { status: 409 });
      }
      throw mError;
    }

    // 4. Send Email
    if (owner?.email) {
      await sendOrganizationApplicationEmail({
        to: owner.email,
        organizationName: org.name,
        applicantName: profile.full_name || profile.username || 'A Student',
        applicantReputation: profile.reputation_points || 0,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Application API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
