import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ doubts: [], mentors: [], subjects: [] });
  }

  const supabase = await createSupabaseServer();

  try {
    // 1. Search Doubts using FTS with ilike fallback
    let { data: doubts } = await supabase
      .from('doubts')
      .select('id, title, status, votes, created_at, profiles(full_name)')
      .textSearch('fts', query, { config: 'english', type: 'websearch' })
      .limit(5);

    if (!doubts || doubts.length === 0) {
      const { data: fallbackDoubts } = await supabase
        .from('doubts')
        .select('id, title, status, votes, created_at, profiles(full_name)')
        .ilike('title', `%${query}%`)
        .limit(5);
      doubts = fallbackDoubts;
    }

    // 2. Search Mentors
    const { data: mentors } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role')
      .eq('role', 'mentor')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(5);

    // 3. Search Subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, slug')
      .ilike('name', `%${query}%`)
      .limit(5);

    return NextResponse.json({
      doubts: doubts || [],
      mentors: mentors || [],
      subjects: subjects || [],
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
