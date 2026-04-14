import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendOrganizationApplicationEmail } from '@/lib/email';

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing');
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { orgId, userId } = await req.json();

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: profile, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pError) throw pError;

    const { data: org, error: oError } = await supabaseAdmin
      .from('organizations')
      .select('name, owner_id, min_reputation')
      .eq('id', orgId)
      .single();

    if (oError) throw oError;

    const requiredRep = org.min_reputation || 50;
    if ((profile?.reputation_points || 0) < requiredRep) {
      return NextResponse.json(
        {
          error: `Insufficient reputation. This organization requires ${requiredRep} points.`,
        },
        { status: 403 }
      );
    }

    const { data: owner } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', org.owner_id)
      .single();

    const { error: mError } = await supabaseAdmin.from('organization_memberships').insert({
      organization_id: orgId,
      user_id: userId,
      status: 'pending',
    });

    if (mError) {
      if (mError.code === '23505') {
        return NextResponse.json({ error: 'Already applied' }, { status: 409 });
      }
      throw mError;
    }

    if (owner?.email) {
      await sendOrganizationApplicationEmail({
        to: owner.email,
        organizationName: org.name,
        applicantName: profile.full_name || profile.username || 'A Student',
        applicantReputation: profile.reputation_points || 0,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Application API Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
