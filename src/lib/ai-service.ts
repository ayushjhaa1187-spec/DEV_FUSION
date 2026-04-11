import { GoogleGenerativeAI } from '@google/generative-ai';

// Support both common environment variable names for flexibility
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

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
    let cleaned = text.trim();
    
    // Look for JSON block if AI used markdown
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // Final sanitization
    cleaned = cleaned
      .replace(/\\n/g, ' ')
      .replace(/,(\s*[\]\}])/g, '$1'); 

    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('[AI Service] JSON parsing failed, attempting secondary cleanup...', err);
    try {
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
    explanation: "I encountered an error while processing your request. Please ensure your API key is valid and try again.",
    steps: ["Verify API Key in environment variables", "Check network connectivity", "Ensure the prompt is valid"],
    suggested_tags: ["Error Handling", "System"],
  };

  if (!API_KEY) {
    console.error('[AI Service] GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set');
    return {
        ...fallback,
        explanation: "API configuration missing. Please set GEMINI_API_KEY in your environment."
    };
  }

  const prompt = `You are SkillBridge AI, an elite academic polymath. 
Your goal is to provide deep, exhaustive, and crystal-clear conceptual explanations. 
DO NOT make excuses. DO NOT provide short or vague answers. 

User Question: "${question}"
${context ? `Subject Context: ${context}` : ''}

Provide a comprehensive breakdown. 
Response format (Strict valid JSON ONLY):
{
  "explanation": "Detailed, ultra-clear conceptual explanation with examples where applicable.",
  "steps": ["Logical Step 1 of solving/understanding", "Step 2", "Step 3..."],
  "suggested_tags": ["Topic1", "Concept2"]
}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { temperature: 0.7, topP: 0.9, topK: 40 } 
    });
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON<AIDoubtResponse>(text, fallback);
  } catch (error: any) {
    console.error(`[AI Service] Error:`, error.message);
    
    // Fallback attempt with a different model if flash fails
    try {
      const stableModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const stableResult = await stableModel.generateContent(prompt);
      return extractJSON<AIDoubtResponse>(stableResult.response.text(), fallback);
    } catch (innerError: any) {
        console.error(`[AI Service] Recursive Fallback Error:`, innerError.message);
    }
    
    return {
        ...fallback,
        explanation: `AI Error: ${error.message}. Please check your Gemini API key and quota.`
    };
  }
}

export async function generatePracticeQuiz(subject: string, topic: string, count: number = 10) {
  if (!API_KEY) {
    console.error('[AI Service] API key is missing for quiz generation');
    return [];
  }

  const prompt = `You are a professional academic examiner. Generate exactly ${count} high-quality, conceptual multiple-choice questions for college students.
Subject: "${subject}"
Topic: "${topic}"

Rules:
1. Every question must have exactly 4 options.
2. Each option must be distinct.
3. Only ONE correct_answer_index (0-3).
4. provide a clear 'explanation' for the correct answer.
5. Questions must be conceptual and challenging, not just trivia.

Respond ONLY with a valid JSON array of objects:
[
  {
    "question_text": "Question content...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_index": 0,
    "explanation": "Why this is correct..."
  }
]`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { temperature: 0.8, topP: 0.9 } 
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = extractJSON<any[]>(text, []);
    
    // Validation
    if (!Array.isArray(questions)) return [];
    
    return questions.filter(q => 
        q.question_text && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        typeof q.correct_answer_index === 'number'
    ).slice(0, count);
  } catch (error: any) {
    console.error('[AI Service] Quiz Generation Error:', error.message);
    return [];
  }
}


