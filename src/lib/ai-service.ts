import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';

// ─── Environment Configuration ───────────────────────────────────────────────
export const getGeminiApiKey = () => 
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
  process.env.GOOGLE_AI_API_KEY || 
  '';

const API_KEY = getGeminiApiKey();
const genAI = new GoogleGenerativeAI(API_KEY);

// Canonical model names
const PRIMARY_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

// ─── Types & Schemas ─────────────────────────────────────────────────────────
export interface AIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const AIDoubtResponseSchema = z.object({
  explanation: z.string(),
  steps: z.array(z.string()),
  suggested_tags: z.array(z.string()),
});

export type AIDoubtResponse = z.infer<typeof AIDoubtResponseSchema>;

export const AIQuizSchema = z.array(z.object({
  question_text: z.string(),
  options: z.array(z.string()).length(4),
  correct_answer_index: z.number().min(0).max(3),
  explanation: z.string(),
}));

// ─── Internal Utilities ──────────────────────────────────────────────────────

/**
 * Robustly extracts and parses JSON from AI responses.
 */
function extractJSON<T>(text: string, schema: z.ZodSchema<T>): T {
  try {
    let cleaned = text.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) cleaned = jsonMatch[0];

    // Handle common AI punctuation issues in JSON
    cleaned = cleaned
      .replace(/\\n/g, ' ')
      .replace(/,(\s*[\]\}])/g, '$1'); 

    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  } catch (err: any) {
    console.warn('[AI Service] JSON extraction or validation failed:', err.message);
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }
}

/**
 * Generic wrapper for Gemini calls with retry and timeout logic.
 */
async function callGemini(prompt: string, modelName: string = PRIMARY_MODEL): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Create a timeout promise (~10s as requested)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('AI timeout')), 10000)
  );

  try {
    console.log(`[AI Service] Calling ${modelName}...`);
    const resultPromise = model.generateContent(prompt);
    
    // Race between the API call and the timeout
    const response = await Promise.race([resultPromise, timeoutPromise]) as any;
    
    const text = response.response?.text();
    if (!text) throw new Error("AI returned empty response");
    return text;
  } catch (err: any) {
    console.error(`[AI Service] Call failed for ${modelName}:`, err.message);
    throw err;
  }
}

/**
 * Public execution wrapper with retry logic (Max 2 retries).
 */
async function executeWithRetry<T>(
  prompt: string, 
  schema: z.ZodSchema<T>, 
  retries: number = 2
): Promise<AIResult<T>> {
  let lastError = '';

  for (let i = 0; i <= retries; i++) {
    try {
      // On the final retry, fallback to the more stable model
      const modelToUse = i === retries ? FALLBACK_MODEL : PRIMARY_MODEL;
      const text = await callGemini(prompt, modelToUse);
      const data = extractJSON(text, schema);
      return { success: true, data };
    } catch (err: any) {
      lastError = err.message;
      console.warn(`[AI Service] Attempt ${i + 1} failed: ${lastError}`);
      if (i < retries) {
        // Exponential backoff or simple delay
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }
  }

  return { success: false, error: lastError || 'Unknown AI error' };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Solves an academic doubt with structured output.
 */
export async function askAIDoubt(question: string, context?: string): Promise<AIResult<AIDoubtResponse>> {
  if (!API_KEY) return { success: false, error: 'AI_KEY_MISSING' };

  const prompt = `You are SkillBridge AI, an elite academic expert. 
Answer the following concisely and pedagogically.

User Question: "${question}"
${context ? `Subject Context: ${context}` : ''}

Strict Valid JSON ONLY:
{
  "explanation": "Deep conceptual explanation",
  "steps": ["Step 1", "Step 2", "..."],
  "suggested_tags": ["TopicA", "TopicB"]
}`;

  return executeWithRetry(prompt, AIDoubtResponseSchema);
}

/**
 * Generates a practice quiz for a subject/topic.
 */
export async function generatePracticeQuiz(subject: string, topic: string, count: number = 10): Promise<AIResult<any[]>> {
  if (!API_KEY) return { success: false, error: 'AI_KEY_MISSING' };

  const prompt = `Generate exactly ${count} MCQs for ${subject} on ${topic}.
Strict Valid JSON Array:
[
  {
    "question_text": "...", 
    "options": ["a", "b", "c", "d"],
    "correct_answer_index": 0,
    "explanation": "..."
  }
]`;

  return executeWithRetry(prompt, AIQuizSchema);
}

/**
 * Suggests curiosity-building follow-up questions.
 */
export async function getFollowUpQuestions(question: string, answer: string): Promise<string[]> {
  if (!API_KEY) return [];

  const prompt = `Based on: "${question}" and response: "${answer}", suggest 3 deep follow-up questions.
JSON Array: ["Q1", "Q2", "Q3"]`;

  const result = await executeWithRetry(prompt, z.array(z.string()));
  return result.success ? (result.data || []) : [];
}
