/**
 * /api/ai/solve/route.ts
 *
 * Streams a Gemini 2.0 Flash answer for a user's doubt.
 * Gating order:
 *   1. Auth check
 *   2. Daily free limit (Free tier: 5/day at no credit cost)
 *   3. Credit wallet deduction (if over daily free limit)
 *   4. Gemini streaming
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  consumeCredit,
  enforcePlanLimit,
} from "@/lib/usage";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Schema ───────────────────────────────────────────────────────────────────
const SolveSchema = z.object({
  doubt: z.string().optional(),
  question: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  subject: z.string().max(100).default("General Academy"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

// ─── Free tier daily limit ────────────────────────────────────────────────────
const FREE_DAILY_SOLVES = 5;

// ─── System prompt builder ────────────────────────────────────────────────────
function buildSystemPrompt(subject: string, difficulty: string): string {
  return `You are SkillBridge AI — an expert tutor for college students specialising in ${subject}.
Your task is to answer the student's doubt clearly and pedagogically.

Rules:
- Respond in structured Markdown with headers, code blocks, and bullet points as needed.
- Explain STEP BY STEP — do not just give the final answer.
- Match the explanation depth to difficulty level: ${difficulty}.
- If the doubt involves code, always include a working code example with comments.
- End with a "Key Takeaway" section summarising the concept in 1–2 sentences.
- Be encouraging. Use a warm, student-friendly tone.
- Keep response under 800 words unless complexity demands more.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse & validate body
  let body: z.infer<typeof SolveSchema>;
  try {
    const raw = await req.json();
    body = SolveSchema.parse(raw);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Extract query from various possible fields
  const queryText = body.doubt || body.question || (body.title ? `${body.title}\n${body.content || ""}` : body.content);
  
  if (!queryText) {
    return NextResponse.json({ error: "No query content provided" }, { status: 400 });
  }

  const { subject, difficulty } = body;

    // 3. Plan-aware limit check
  const limit = await enforcePlanLimit(user.id, 'ai_doubt_solve', { free: 5, pro: 50, elite: null }, 'daily');
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: `Daily limit reached for ${limit.plan} plan.`,
        upgradeUrl: '/billing/plans',
      },
      { status: 402 }
    );
  }

  // Optional credit deduction for free-tier overflow scenarios
  if (limit.plan === 'free') {
    const creditResult = await consumeCredit(user.id, 'ai_doubt_solve', supabase);
    if (!creditResult.allowed && (creditResult.reason === 'insufficient_credits' || creditResult.reason === 'no_wallet')) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: 'No credits available. Buy a pack to continue.', creditsUrl: '/billing/credits' },
        { status: 402 }
      );
    }
  }

  // 4. Stream from Gemini
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("[ai/solve] No Gemini API key found in environment variables.");
    return NextResponse.json({ 
      error: "ai_config_missing", 
      message: "AI configuration is missing on the server. Please check environment variables." 
    }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `${buildSystemPrompt(subject, difficulty)}\n\n---\nStudent Query: ${queryText}`;

  try {
    let streamResult;
    try {
      streamResult = await model.generateContentStream(prompt);
    } catch (modelErr: any) {
      console.warn("[ai/solve] Gemini 2.0 Flash failed, falling back to 1.5-flash:", modelErr.message);
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      streamResult = await model.generateContentStream(prompt);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              // Send raw text instead of SSE-JSON for easier client parsing
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    console.error("[ai/solve] Gemini execution error:", err);
    return NextResponse.json({ 
      error: "AI service unavailable",
      message: err.message || "The AI encountered an error. This may be due to quota limits or regional restrictions."
    }, { status: 503 });
  }
}
