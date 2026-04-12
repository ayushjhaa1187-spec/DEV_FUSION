import { NextRequest, NextResponse } from 'next/server';
import { getFollowUpQuestions } from '@/lib/ai-service';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question, answer } = await req.json();
    
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const followUps = await getFollowUpQuestions(question, answer);
    return NextResponse.json({ followUps });
  } catch (error: any) {
    console.error('[AI Follow-up API Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
