import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, difficulty, count = 10 } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'subject and topic are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const prompt = `Create ${count} MCQ questions for college students.\nSubject: ${subject}, Topic: ${topic}, Difficulty: ${difficulty || 'medium'}\n\nReturn ONLY valid JSON array in this format:\n[{"id":1,"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct_answer":"A","explanation":"..."}]`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const questions = JSON.parse(text) as QuizQuestion[];
      return NextResponse.json({ questions });
    } catch {
      return NextResponse.json({ error: 'Failed to parse quiz' }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI service unavailable';
    console.error('AI quiz-generator error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
