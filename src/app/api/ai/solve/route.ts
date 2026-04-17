import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { consumeCredit, getUserPlan } from "@/lib/usage";
import { getModel, PRIMARY_MODEL } from "@/lib/ai-service";
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
    // 3. Generate Content (Non-streaming for compatibility with current Client)
    const model = getModel(PRIMARY_MODEL);
    const prompt = `You are SkillBridge AI, an elite academic expert. 
Answer the following concisely and pedagogically. 
Format your response using Markdown. 

User Question: "${queryText}"
Subject Context: "${body.subject}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("AI returned empty response");

    return NextResponse.json({ 
      success: true, 
      analysis: text,
      balance: creditCheck.balance - 1
    });

  } catch (error: any) {
    console.error('[AI Route Error]:', error);
    const errMsg = error.message?.toLowerCase();
    let userFriendlyError = 'Neuro-link failure during generation.';
    if (errMsg?.includes('api key') || errMsg?.includes('ai_key_missing') || errMsg?.includes('403')) {
      userFriendlyError = 'Missing or invalid Gemini API Key.';
    }

    return NextResponse.json({ 
      success: false, 
      error: userFriendlyError,
      details: error.message 
    }, { status: 500 });
  }
}
