import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(req.url);
  
  const subjectId   = searchParams.get('subject_id');
  const status      = searchParams.get('status');
  const sort        = searchParams.get('sort');         // 'trending', 'recent'
  const filter      = searchParams.get('filter');       // 'unanswered'
  const personalized = searchParams.get('personalized'); // 'true'

  let query = supabase.from('doubts_with_stats').select('*');

  // 1. Basic Filters
  if (subjectId) query = query.eq('subject_id', subjectId);
  if (status)    query = query.eq('status', status);

  // 2. Specialized Filters
  if (filter === 'unanswered') {
    query = query.eq('answers_count', 0);
  }

  if (personalized === 'true' && user) {
    // Branch matching (direct JSONB query for accuracy)
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch')
      .eq('id', user.id)
      .single();

    if (profile?.branch) {
      // Use SQL to check JSONB field: academic_context_snapshot ->> 'branch' = profile.branch
      query = query.filter('academic_context_snapshot->>branch', 'eq', profile.branch);
    }
    
    // Subject matching via user_subjects enrollment
    const { data: subIds } = await supabase
      .from('user_subjects')
      .select('subject_id')
      .eq('user_id', user.id);
    
    if (subIds && subIds.length > 0) {
      query = query.in('subject_id', subIds.map(s => s.subject_id));
    }
  }

  // 3. Sorting / Ranking
  if (sort === 'trending') {
    // PS#2 Specific weighting: (votes * 0.7 + answers_count * 0.3)
    // Handled by the database view logic updated in Step 1
    query = query.order('trending_score', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, subject_id, branch, semester } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('branch, semester')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('doubts')
      .insert({
        author_id: user.id,
        title,
        content,
        subject_id,
        academic_context_snapshot: {
          branch: branch || profile?.branch,
          semester: semester || profile?.semester,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
