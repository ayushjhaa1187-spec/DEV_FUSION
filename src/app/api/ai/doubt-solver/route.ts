import { NextRequest, NextResponse } from 'next/server';
import { askAIDoubt } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const aiResponse = await askAIDoubt(question, context);
    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
