import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use gemini-2.0-flash for better availability and speed
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export interface AIDoubtResponse {
  explanation: string;
  steps: string[];
  suggested_tags: string[];
}

function extractJSON<T>(text: string, fallback: T): T {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  // Try to find a JSON object or array in the text
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  
  try {
    if (objMatch) return JSON.parse(objMatch[0]) as T;
    if (arrMatch) return JSON.parse(arrMatch[0]) as T;
  } catch {
    // JSON.parse failed, use fallback
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

  const prompt = `You are SkillBridge AI, a world-class academic tutor known for Socratic teaching and intuitive conceptual breakdowns. 
A student has a doubt: "${question}"
${context ? `Extra context: ${context}` : ''}

Your goal is to build conceptual clarity, not just give the answer.
Please provide:
1. A clear, encouraging "Intuition" section that explains the core 'Why' behind the concept.
2. A logical, step-by-step breakdown using analogies where possible.
3. 3-5 specific academic tags for categorization.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "explanation": "Brief intuitive overview...",
  "steps": ["Step 1: The Foundation...", "Step 2: The Logic...", "Step 3: Edge Cases..."],
  "suggested_tags": ["tag1", "tag2", "tag3"]
}`;

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

  const prompt = `Generate 5 high-quality, conceptual multiple-choice questions for college students studying "${subject}" on the topic "${topic}".
Ensure clear distinctions between answer options.

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {
    "question_text": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer_index": 0,
    "explanation": "..."
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = extractJSON<unknown[]>(text, []);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI returned invalid quiz structure');
    }

    return questions;
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return [];
  }
}
