import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { enforcePlanLimit } from "@/lib/usage";
import { askAIDoubt } from "@/lib/ai-service";
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
 * Lean MVP endpoint for AI problem solving.
 * Centralizes logic via src/lib/ai-service.ts
 */
export async function POST(req: NextRequest) {
  // 1. Auth Enforcement
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse & Validate Body
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

  // 3. Plan-aware limit check
  const limit = await enforcePlanLimit(user.id, 'ai_doubt_solve', { free: 5, pro: 50, elite: null }, 'daily');
  if (!limit.allowed) {
    return NextResponse.json({
      success: false,
      error: 'limit_reached',
      message: `Daily limit reached for ${limit.plan} plan.`,
    }, { status: 402 });
  }

  // 4. Centralized AI Execution
  const result = await askAIDoubt(queryText, body.subject);

  if (!result.success) {
    return NextResponse.json({ 
      success: false, 
      error: result.error || "AI service failed" 
    }, { status: 500 });
  }

  // Return standard success response
  return NextResponse.json({
    success: true,
    data: result.data,
    remaining: limit.remaining
  });
}
