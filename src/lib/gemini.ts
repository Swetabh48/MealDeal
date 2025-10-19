import { GoogleGenerativeAI } from '@google/generative-ai';

// Verify API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
}

// Initialize Gemini AI with base URL that uses v1 API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get the model - these are the correct model names for Gemini API
export function getGeminiModel(modelName: string = 'gemini-2.5-flash') {
  // The SDK automatically uses the correct API version
  // Just make sure to use the correct model names
  return genAI.getGenerativeModel({ model: modelName });
}

export default genAI;