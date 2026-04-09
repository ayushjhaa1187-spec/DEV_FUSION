import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Provide robust fallback if DB has not been seeded yet
  if (!data || data.length === 0) {
    return NextResponse.json([
      { id: '1', name: 'Data Structures and Algorithms' },
      { id: '2', name: 'Operating Systems' },
      { id: '3', name: 'Database Management Systems' },
      { id: '4', name: 'Computer Networks' },
      { id: '5', name: 'Machine Learning' },
      { id: '6', name: 'Web Development' },
      { id: '7', name: 'System Design' }
    ]);
  }

  return NextResponse.json(data);
}
