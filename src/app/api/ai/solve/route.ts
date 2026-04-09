import { NextRequest, NextResponse } from 'next/server';
import { askAIDoubt } from '@/lib/ai-service';
import { createSupabaseServer } from '@/lib/supabase/server';
import { checkAndIncrementUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question, context } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Check usage limits (AI Interviews)
    const { allowed, remaining } = await checkAndIncrementUsage(user.id, 'interview');
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Free tier limit reached (5 AI interviews/month). Upgrade to Pro for unlimited access!',
        limitReached: true 
      }, { status: 403 });
    }

    const aiResponse = await askAIDoubt(question, context);
    return NextResponse.json({ ...aiResponse, remaining });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
