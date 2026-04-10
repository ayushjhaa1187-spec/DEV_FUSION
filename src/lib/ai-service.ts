import { GoogleGenerativeAI } from '@google/generative-ai';

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}
// ---------------------------------------------------------------

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// gemini-1.5-flash is highly stable and widely available
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface AIDoubtResponse {
  explanation: string;
  steps: string[];
  suggested_tags: string[];
}

function extractJSON<T>(text: string, fallback: T): T {
  try {
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const startIdx = Math.min(
      cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
      cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
    );
    const endIdx = Math.max(
      cleaned.lastIndexOf('}'),
      cleaned.lastIndexOf(']')
    );
    if (startIdx !== Infinity && endIdx !== -1) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
      return JSON.parse(cleaned) as T;
    }
  } catch (err) {
    console.warn('JSON parsing failed, raw text:', text);
  }
  return fallback;
}

export async function askAIDoubt(question: string, context?: string): Promise<AIDoubtResponse> {
  const fallback: AIDoubtResponse = {
    explanation: "I'm having a bit of trouble right now. Please try again in a moment, or post your doubt to the community!",
    steps: [],
    suggested_tags: [],
  };
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return fallback;
  }
  const prompt = `You are SkillBridge AI, a world-class academic tutor.\nA student has a doubt: "${question}"\n${context ? `Extra context: ${context}` : ''}\nRespond ONLY with valid JSON:\n{\n  "explanation": "Brief intuitive overview...",\n  "steps": ["Step 1...", "Step 2..."],\n  "suggested_tags": ["tag1", "tag2"]\n}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON<AIDoubtResponse>(text, fallback);
  } catch (error) {
    console.error('AI Service Error:', error);
    return fallback;
  }
}

export async function generatePracticeQuiz(subject: string, topic: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return [];
  }
  const prompt = `Generate 10 high-quality, conceptual multiple-choice questions for college students studying "${subject}" on the topic "${topic}".\nEnsure clear distinctions between answer options and provide a logical step-by-step explanation for the correct answer.\nRespond ONLY with a JSON array of 10 objects like this:\n[\n  {\n    "question_text": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "correct_answer_index": 0,\n    "explanation": "..."\n  }\n]`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = extractJSON<any[]>(text, []);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI returned invalid quiz structure');
    }
    // Safeguard — take only up to 10 if AI over-generates
    return questions.slice(0, 10);
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return [];
  }
}
