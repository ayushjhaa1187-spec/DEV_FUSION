import { NextRequest, NextResponse } from 'next/server';
import { generatePracticeQuiz } from '@/lib/ai-service';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, topic } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Subject and Topic are required' }, { status: 400 });
    }

    const questions = await generatePracticeQuiz(subject, topic);
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('MCQ API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
