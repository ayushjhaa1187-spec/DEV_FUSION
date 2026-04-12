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

    const API_KEY = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    const MODEL = process.env.GROQ_API_KEY 
      ? 'llama-3.1-8b-instant' 
      : 'meta-llama/llama-3.1-8b-instruct';
    const URL = process.env.GROQ_API_KEY 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://openrouter.ai/api/v1/chat/completions';

    if (!API_KEY) {
      return new Response('AI API Key not configured', { status: 500 });
    }

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

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_API_KEY ? {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'SkillBridge',
        } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Provider Error:', error);
      return new Response('AI failed to respond', { status: 502 });
    }

    // Proxy the stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const json = JSON.parse(data);
                  const content = json.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch (e) {
                  // Ignore non-json chunks
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Solve doubt route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
