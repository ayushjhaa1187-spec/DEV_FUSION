import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// gemini-1.5-flash-latest is highly stable and widely available
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

export interface AIDoubtResponse {
  explanation: string;
  steps: string[];
  suggested_tags: string[];
}

function extractJSON<T>(text: string, fallback: T): T {
  try {
    // 1. Remove markdown backticks and 'json' identifiers
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. Locate the first '{' or '[' and the last '}' or ']'
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

  const prompt = `You are SkillBridge AI, a world-class academic tutor.
A student has a doubt: "${question}"
${context ? `Extra context: ${context}` : ''}

Respond ONLY with valid JSON:
{
  "explanation": "Brief intuitive overview...",
  "steps": ["Step 1...", "Step 2..."],
  "suggested_tags": ["tag1", "tag2"]
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
