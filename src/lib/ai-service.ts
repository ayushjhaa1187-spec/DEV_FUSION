import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// gemini-1.5-flash is highly stable, ultra-fast, and ideal for instant doubt resolution
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
});

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

  const prompt = `You are SkillBridge AI, a world-class academic tutor specializing in student doubt resolution.
Your goal is to provide INSTANT conceptual clarity so students don't need to wait for community answers.

Student Doubt: "${question}"
${context ? `Additional Context: ${context}` : ''}

CRITICAL INSTRUCTIONS:
1. Be concise but deep. Use metaphors to explain complex logic.
2. Provide a logical, step-by-step breakdown.
3. Suggest 3 relevant academic tags.
4. Respond ONLY with valid JSON in this exact format:
{
  "explanation": "A high-impact, intuitive explanation that solves the core doubt instantly.",
  "steps": ["Step 1: Focus on X...", "Step 2: Apply Y...", "Step 3: Conclude with Z..."],
  "suggested_tags": ["Computer Science", "Algorithms", "Logic"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON<AIDoubtResponse>(text, fallback);
  } catch (error: any) {
    console.error(' [AI Service Error Details]:', error);
    
    let errorMessage = "I'm having a bit of trouble right now. Please check your API key and quota.";
    
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = "AI Configuration Error: Invalid API Key found in Vercel.";
    } else if (error.message?.includes('quota') || error.status === 429) {
      errorMessage = "AI Quota Error: Monthly limits reached for this API key.";
    } else if (error.message?.includes('safety')) {
      errorMessage = "AI Safety Error: This query was filtered for academic safety.";
    } else if (error.message?.includes('not found')) {
      errorMessage = "AI Model Error: The selected Gemini model is not available in your region.";
    }

    return {
      ...fallback,
      explanation: errorMessage
    };
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
