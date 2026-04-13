import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, slug, description, website, logo_url, min_reputation } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    // 1. Check if user already has an organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existingOrg) {
      return NextResponse.json({ error: 'You already own an organization' }, { status: 409 });
    }

    // 2. Check if slug is taken
    const { data: slugCheck } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug.toLowerCase())
      .single();

    if (slugCheck) {
      return NextResponse.json({ error: 'Organization URL (slug) is already taken' }, { status: 409 });
    }

    // 3. Begin Transaction (Role Update + Org Insertion)
    // Update profile role
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'organization' })
      .eq('id', user.id);

    if (roleError) throw roleError;

    // Use user.id as the organization ID (1:1 mapping as per schema)
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: user.id,
        owner_id: user.id,
        name,
        slug: slug.toLowerCase(),
        description,
        website,
        logo_url,
        min_reputation: min_reputation || 50,
        is_verified: false
      });

    if (orgError) {
      // Rollback role if org creation fails
      await supabase.from('profiles').update({ role: 'student' }).eq('id', user.id);
      throw orgError;
    }

    return NextResponse.json({ success: true, slug });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
