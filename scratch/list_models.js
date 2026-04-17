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

async function list() {
    try {
        console.log('Listing models...');
        // The Node SDK doesn't have a direct listModels in the main export sometimes depending on version
        // But let's try to fetch it via the client if possible or use fetch
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log('- ', m.name, '(', m.supportedGenerationMethods, ')'));
        } else {
            console.log('No models found or error:', data);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

list();
