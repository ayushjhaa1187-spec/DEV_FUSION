import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json([
      { id: '1c07d977-0eeb-4bfa-baa2-b1df5b15bdb2', name: 'Data Structures and Algorithms' },
      { id: 'b51cc189-3997-41aa-89f1-68a41ed00375', name: 'Operating Systems' },
      { id: 'eab82c9f-3951-419b-a010-0a2b0aa0dabb', name: 'Database Management Systems' },
      { id: '34e9e03d-8f9f-4db7-a414-f8b8a5fc768e', name: 'Computer Networks' },
      { id: '94d3c11b-685b-4394-a4b5-ea9a0a4cbb79', name: 'Machine Learning' },
      { id: 'bb2f0bf2-4ed0-4354-94c6-e9e43dfa72aa', name: 'Web Development' },
      { id: 'fedc5e93-9c86-4447-97d8-112dfd66bd2d', name: 'System Design' }
    ]);
  }

  return NextResponse.json(data);
}
