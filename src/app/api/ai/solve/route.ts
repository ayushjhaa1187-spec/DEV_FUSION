import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { consumeCredit, getUserPlan } from "@/lib/usage";
import { streamAIDoubt } from "@/lib/ai-service";
import { z } from "zod";

const SolveSchema = z.object({
  doubt: z.string().optional(),
  question: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  subject: z.string().max(100).default("General Academy"),
});

/**
 * /api/ai/solve
 * PROD-READY: Supports streaming and credit deduction.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 1. Parse & Validate
  let body: z.infer<typeof SolveSchema>;
  try {
    const raw = await req.json();
    body = SolveSchema.parse(raw);
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const queryText = body.doubt || body.question || (body.title ? `${body.title}\n${body.content || ""}` : body.content);
  
  if (!queryText) {
    return NextResponse.json({ success: false, error: "No query content provided" }, { status: 400 });
  }

  // 2. Credit Deduction (Priority 4)
  // Atomic deduction BEFORE triggering the expensive AI call
  const creditCheck = await consumeCredit(user.id, 'ai_doubt_solve', supabase);
  
  if (!creditCheck.allowed) {
    return NextResponse.json({
      success: false,
      error: 'insufficient_credits',
      message: 'You have exhausted your neural credits. Please upgrade or purchase more.',
      balance: creditCheck.balance
    }, { status: 402 });
  }

  try {
    // 3. Initiate Stream (Priority 4)
    const geminiStream = await streamAIDoubt(queryText, body.subject);

    // Convert Gemini stream to a standard ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of geminiStream) {
          const text = chunk.text();
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AI Solve Error]:', error);
    // Note: Since we already deducted credits, in a real app we might want to refund 
    // but for MVP we log and fail.
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Neuro-link failure during generation." 
    }, { status: 500 });
  }
}
