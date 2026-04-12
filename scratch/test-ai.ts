import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = 'gemini-1.5-flash';

async function testAI() {
  console.log('--- AI Connectivity Test ---');
  console.log(`API Key prefix: ${API_KEY.substring(0, 8)}...`);
  
  if (!API_KEY) {
    console.error('ERROR: No API key found in .env.local');
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = 'Hello Gemini! Please respond with a single word: SUCCESS. No other text.';
    
    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`Gemini response: ${text}`);
    if (text.includes('SUCCESS')) {
      console.log('RESULT: Connectivity verified successfully!');
    } else {
      console.warn('RESULT: Unexpected response format, but connectivity seems OK.');
    }
  } catch (error: any) {
    console.error('ERROR: AI Request failed!');
    console.error(`Message: ${error.message}`);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('HINT: Your API key is invalid.');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('HINT: Your API quota has been reached.');
    }
  }
}

testAI();
