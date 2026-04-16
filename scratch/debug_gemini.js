const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.log("API Key missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-1.5-flash"; // The one I'm using
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = "Generate a JSON array of 1 MCQ about Mathematics. Result MUST be valid JSON only.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Response Text:", text);
    
    // Test extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Parsed Succesfully:", parsed.length);
    } else {
        console.log("No JSON array found");
    }
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }
}

checkGemini();
