import { NextRequest, NextResponse } from 'next/server';
import { generatePracticeQuiz } from '@/lib/ai-service';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndIncrementUsage } from '@/lib/usage';

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

    // Check usage limits
    const { allowed, remaining } = await checkAndIncrementUsage(user.id, 'question');
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Free tier limit reached (10 questions/day). Upgrade to Pro for unlimited access!',
        limitReached: true 
      }, { status: 403 });
    }

    const questions = await generatePracticeQuiz(subject, topic);
    
    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to generate quiz. This could be due to API quota limits or an invalid Gemini key.' 
      }, { status: 500 });
    }


    return NextResponse.json({ questions, remaining });
  } catch (error) {
    console.error('MCQ API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
