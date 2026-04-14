const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

async function testStream() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log("--- Testing gemini-2.5-flash ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContentStream("Hi");
        for await (const chunk of result.stream) {
            console.log("2.5 Chunk:", chunk.text());
        }
    } catch (err) {
        console.error("2.5 Error:", err.message);
    }

    console.log("\n--- Testing gemini-flash-latest ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContentStream("Hi");
        for await (const chunk of result.stream) {
            console.log("Flash Chunk:", chunk.text());
        }
    } catch (err) {
        console.error("Flash Error:", err.message);
    }
}

testStream();
