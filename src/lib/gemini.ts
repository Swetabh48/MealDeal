import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing from environment variables');
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Please configure GEMINI_API_KEY in your deployment platform (Vercel/Railway/etc)');
  } else {
    console.error('❌ Please add GEMINI_API_KEY to your .env.local file');
  }
  console.error('❌ Get your free API key: https://aistudio.google.com/app/apikey');
} else {
  console.log('✅ GEMINI_API_KEY is configured');
  console.log(`✅ Key length: ${GEMINI_API_KEY.length} characters`);
  console.log(`✅ Key preview: ${GEMINI_API_KEY.substring(0, 15)}...`);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export function getGeminiModel(modelName: string = 'gemini-1.5-flash-latest') {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured. ' +
      (process.env.NODE_ENV === 'production' 
        ? 'Please set GEMINI_API_KEY in your deployment environment variables.' 
        : 'Please add GEMINI_API_KEY to your .env.local file.')
    );
  }
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });
    
    return model;
  } catch (error: any) {
    console.error(`Failed to initialize model ${modelName}:`, error.message);
    throw new Error(`Failed to initialize AI model: ${error.message}`);
  }
}

export default genAI;