import { GoogleGenerativeAI } from '@google/generative-ai';

// Verify API key exists
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  console.error('❌ Please add GEMINI_API_KEY to your Vercel environment variables');
  console.error('❌ Get your key from: https://aistudio.google.com/app/apikey');
} else {
  console.log('✅ GEMINI_API_KEY is configured');
  console.log('✅ Key length:', GEMINI_API_KEY.length);
  console.log('✅ Key starts with:', GEMINI_API_KEY.substring(0, 10) + '...');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'dummy-key-for-build');

// Get the model with validation
export function getGeminiModel(modelName: string = 'gemini-2.5-flash') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'dummy-key-for-build') {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.');
  }
  
  return genAI.getGenerativeModel({ model: modelName });
}

export default genAI;