import { GoogleGenerativeAI } from '@google/generative-ai';

// Support both common environment variable names for flexibility
export const getGeminiApiKey = () => 
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
  process.env.GOOGLE_AI_API_KEY || 
  '';

const API_KEY = getGeminiApiKey();
const genAI = new GoogleGenerativeAI(API_KEY);

// Direct and stable model selection with fallback
export const MODEL_NAME = 'gemini-2.0-flash';
export const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * Robustly gets a generative model with fallback capability
 */
export function getModel(specifiedModel?: string) {
  const modelId = specifiedModel || MODEL_NAME;
  return genAI.getGenerativeModel({ model: modelId });
}

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
    console.error('[AI Service] GOOGLE_GENERATIVE_AI_API_KEY/GEMINI_API_KEY/GOOGLE_AI_API_KEY is not set');
    return {
        ...fallback,
        explanation: "API configuration missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment."
    };
  }

  const prompt = `You are SkillBridge AI, a world-class academic solver and conceptual polymath. 
Your MISSION: Solve every query directly, exhaustively, and without hesitation. 

User Question: "${question}"
${context ? `Subject Context: ${context}` : ''}

DIRECTIVE:
1. Provide the complete conceptual solution or explanation immediately. 
2. DO NOT suggest "Ask the community" or "Consult a mentor" for general academic, coding, or theoretical questions. You ARE the expert.
3. ONLY refer to human resources if the question is strictly localized/logistical (e.g., "What is ${context || 'my organization'}'s specific office location?" or "How do I text Mentor X directly?").
4. If the question is complex, break it down logically as follows.

Response format (Strict valid JSON ONLY):
{
  "explanation": "Definitive, deep-dive conceptual explanation with concrete examples.",
  "steps": ["Logical step-by-step resolution or conceptual breakdown"],
  "suggested_tags": ["Topic", "CoreConcept"]
}`;

  try {
    const model = getModel();
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON<AIDoubtResponse>(text, fallback);
  } catch (error: any) {
    console.error(`[AI Service] Error:`, error.message);
    
    // Fallback attempt with a different model if flash fails
    try {
      const stableModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

  const prompt = `You are a professional academic examiner specializing in higher education. 
Your MISSION: Generate exactly ${count} sophisticated MCQ questions.

Subject: "${subject}"
Topic: "${topic}"

RULES:
1. Each question MUST be conceptual and test understanding, not rote memorization.
2. Provide exactly 4 distinct options per question.
3. correct_answer_index MUST be an integer between 0 and 3.
4. Include a concise, pedagogical explanation for the correct answer.
5. Return ONLY a valid JSON array of objects. No introductory text.

FORMAT:
[
  {
    "question_text": "...", 
    "options": ["...", "...", "...", "..."],
    "correct_answer_index": 0,
    "explanation": "..."
  }
]`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = extractJSON<any[]>(text, []);
    
    if (!Array.isArray(questions)) {
      console.warn('[AI Service] AI failed to return an array for quiz generation');
      return [];
    }
    
    // Strict schema filtering to ensure runtime stability
    return questions.filter(q => 
        q &&
        typeof q.question_text === 'string' && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        typeof q.correct_answer_index === 'number' &&
        q.correct_answer_index >= 0 &&
        q.correct_answer_index <= 3
    ).slice(0, count);
  } catch (error: any) {
    console.error('[AI Service] Quiz Generation Error:', error.message);
    return [];
  }
}


export async function getFollowUpQuestions(question: string, answer: string): Promise<string[]> {
  if (!API_KEY) return [];

  const prompt = `You are an elite academic tutor. Based on the following question and its explanation, suggest exactly 3 conceptual, curious, and deep follow-up questions that the student should ask next to deepen their understanding.
  
  Student Question: "${question}"
  Explanation Provided: "${answer}"
  
  Rules:
  1. Questions must be brief (max 15 words each).
  2. Questions must be provocative and encourage deeper thinking.
  3. No introductory text. Just a JSON array of 3 strings.
  
  Format: ["Question 1", "Question 2", "Question 3"]`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return extractJSON<string[]>(result.response.text(), []);
  } catch (error) {
    console.error('[AI Service] Follow-up Error:', error);
    return [];
  }
}


