import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface AIDoubtResponse {
  explanation: string;
  steps: string[];
  suggested_tags: string[];
}

export async function askAIDoubt(question: string, context?: string): Promise<AIDoubtResponse> {
  const prompt = `
    You are SkillBridge AI, an expert academic tutor for college students.
    Student Question: "${question}"
    ${context ? `Context: ${context}` : ''}

    Please provide:
    1. A clear, encouraging explanation.
    2. A step-by-step breakdown of the concept.
    3. 3-5 academic tags (e.g., "Data Science", "Calculus").

    Format the response as JSON:
    {
      "explanation": "...",
      "steps": ["Step 1...", "Step 2..."],
      "suggested_tags": ["tag1", "tag2"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    
    return JSON.parse(jsonMatch[0]) as AIDoubtResponse;
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      explanation: "I'm having trouble connecting to my brain right now. Please try again or post your doubt to the community!",
      steps: [],
      suggested_tags: []
    };
  }
}

export async function generatePracticeQuiz(subject: string, topic: string) {
  const prompt = `
    Generate 5 high-quality, conceptual multiple-choice questions for the subject "${subject}" and topic "${topic}".
    These are for college students. Ensure clear distinctions between options.
    
    Format EXACTLY as a JSON array (no markdown blocks):
    [
      { 
        "question_text": "...", 
        "options": ["A", "B", "C", "D"], 
        "correct_answer_index": 0, 
        "explanation": "..." 
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Improved JSON Extract
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse AI quiz response');
    
    const questions = JSON.parse(jsonMatch[0]);
    
    // Basic Validation
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI returned invalid quiz structure');
    }

    return questions;
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return [];
  }
}

