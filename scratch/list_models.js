const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

async function listModels() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    try {
        // We can't easily list models with the SDK without a project ID in some versions, 
        // but we can try the REST API directly.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models returned or error:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error listing models:", err.message);
    }
}

listModels();
