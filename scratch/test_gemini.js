const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function test() {
    try {
        console.log('Testing Gemini API Key with gemini-flash-latest...');
        const result = await model.generateContent("Hello, respond with 'Success'.");
        const response = await result.response;
        console.log('Gemini Response:', response.text());
    } catch (e) {
        console.error('Gemini Error:', e.message);
    }
}

test();
