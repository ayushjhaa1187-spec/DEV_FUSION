import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { question, subject } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert academic mentor for college students.\nSubject: ${subject || 'General'}\nStudent's doubt: ${question}\n\nProvide a clear, structured answer with:\n1. Core Concept\n2. Step-by-step Solution\n3. Key Points to Remember\n4. Related Topics\n\nKeep the tone friendly and encouraging.`;

    let text;
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (modelErr: any) {
      console.warn("[doubt-solver] Gemini 2.5 failed, falling back to flash-latest:", modelErr.message);
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }

    return NextResponse.json({ answer: text });
  } catch (error: any) {
    const message = error.message || 'AI service unavailable';
    console.error('AI doubt-solver error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
