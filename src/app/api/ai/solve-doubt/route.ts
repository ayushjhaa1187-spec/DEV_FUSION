import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { title, content } = await req.json();
    if (!title) {
       return new Response('Title is required', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ message: 'AI API Key not configured' }), { status: 500 });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a college-level teaching assistant. Explain the following student's doubt step by step.
Follow this specific structure:
1. Identify what the student is confused about.
2. Explain the foundational concept in plain language.
3. Provide a worked example to illustrate the concept.
4. Summarize the key takeaway.

Do NOT just give the final answer directly. Format your response with numbered steps for the main sections. Use bold for key terms.

Doubt Title: ${title}
Doubt Content: ${typeof content === 'string' ? content : JSON.stringify(content)}
`;

    let streamResult;
    try {
      streamResult = await model.generateContentStream(prompt);
      // Small check to see if the stream actually starts (throws if model unavailable)
      await streamResult.response;
    } catch (modelErr: any) {
      console.warn("[solve-doubt] Gemini 2.0 failed, falling back to 1.5:", modelErr.message);
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      streamResult = await model.generateContentStream(prompt);
    }

    // Proxy the stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error: any) {
          console.error("[solve-doubt] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      },
    });

  } catch (error) {
    console.error('Solve doubt route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
