import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify requester is an organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'organization' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Organizations only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const minRep = parseInt(searchParams.get('minRep') || '0');

    let dbQuery = supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, reputation_points, bio, college')
      .eq('recruitment_opt_in', true)
      .gte('reputation_points', minRep)
      .order('reputation_points', { ascending: false })
      .limit(20);

    if (query) {
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,username.ilike.%${query}%,college.ilike.%${query}%`);
    }

    const { data: talent, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json(talent);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
