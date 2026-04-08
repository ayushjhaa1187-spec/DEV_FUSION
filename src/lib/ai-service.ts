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
    You are SkillBridge AI, a world-class academic tutor known for Socratic teaching and intuitive conceptual breakdowns. 
    A student has a doubt: "${question}"
    ${context ? `Extra context: ${context}` : ''}

    Your goal is NOT just to give the answer, but to build conceptual clarity.
    Please provide:
    1. A clear, encouraging "Intuition" section that explains the core 'Why' behind the concept.
    2. A logical, step-by-step breakdown using analogies where possible.
    3. 3-5 specific academic tags for categorization.

    Format the response as JSON:
    {
      "explanation": "Brief intuitive overview...",
      "steps": ["Step 1: The Foundation...", "Step 2: The Logic...", "Step 3: Edge Cases/Nuance..."],
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

