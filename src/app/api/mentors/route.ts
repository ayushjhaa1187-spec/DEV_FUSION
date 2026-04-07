import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty');

  let query = supabase
    .from('mentor_profiles')
    .select('*, profiles(username, avatar_url, full_name)');

  if (specialty) query = query.ilike('specialty', `%${specialty}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
