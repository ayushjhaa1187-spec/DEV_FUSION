const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function solveDoubt(doubtText) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
    You are a helpful academic tutor for college students.
    A student has posted this doubt: "${doubtText}"
    Explain the concept step-by-step. Be clear, structured, and educational.
    Do not just give the final answer — explain the reasoning.
    Format your response as numbered steps.
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateMCQTest({ subject, topic, count = 10 }) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
    Generate ${count} multiple choice questions for subject "${subject}", topic "${topic}".
    Return ONLY a valid JSON array. Each item must have:
    { "text": string, "options": [4 strings], "correctIndex": number (0-3), "explanation": string }
    No markdown. No extra text. Only the raw JSON array.
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

module.exports = { solveDoubt, generateMCQTest };
