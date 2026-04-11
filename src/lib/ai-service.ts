import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Direct and stable model selection
const MODEL_NAME = 'gemini-1.5-flash';

export interface AIDoubtResponse {
  explanation: string;
  steps: string[];
  suggested_tags: string[];
}

/**
 * Robustly extracts and parses JSON from AI responses, even if wrapped in markdown.
 */
function extractJSON<T>(text: string, fallback: T): T {
  try {
    // 1. Remove common AI formatting artifacts
    let cleaned = text.trim();
    
    // 2. Look for JSON block if AI used markdown
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // 3. Final sanitization of escaped characters and trailing commas
    cleaned = cleaned
      .replace(/\\n/g, ' ')
      .replace(/,(\s*[\]\}])/g, '$1'); 

    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('JSON parsing failed, attempting secondary cleanup...', err);
    try {
        // Fallback: very aggressive regex cleanup
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            return JSON.parse(text.slice(start, end + 1)) as T;
        }
    } catch {}
    return fallback;
  }
}

/**
 * World-class academic tutor prompt designed for instant conceptual clarity.
 */
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

  const prompt = `You are SkillBridge AI. Solve this academic doubt instantly.
Question: "${question}"
${context ? `Context: ${context}` : ''}

Response format (valid JSON ONLY):
{
  "explanation": "Brief, ultra-clear conceptual explanation.",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "suggested_tags": ["Tag1", "Tag2"]
}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { temperature: 0.4, topP: 0.8, topK: 40 } 
    });
    
    // Performance optimization: fast generation
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON<AIDoubtResponse>(text, fallback);
  } catch (error: any) {
    console.error(`[AI Interaction] Error:`, error.message);
    
    // Attempt one ultra-stable fallback if flash fails
    try {
      const stableModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const stableResult = await stableModel.generateContent(prompt);
      return extractJSON<AIDoubtResponse>(stableResult.response.text(), fallback);
    } catch {}
    
    return fallback;
  }
}

export async function generatePracticeQuiz(subject: string, topic: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return [];
  }

  const prompt = `Generate 10 high-quality, conceptual multiple-choice questions for college students studying "${subject}" on the topic "${topic}".
Respond ONLY with a JSON array of 10 objects:
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
    const questions = extractJSON<any[]>(text, []);
    return Array.isArray(questions) ? questions.slice(0, 10) : [];
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return [];
  }
}
