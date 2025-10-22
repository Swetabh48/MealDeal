import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ Key preview: ${GEMINI_API_KEY.substring(0, 15)}...`);
  }
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export function getGeminiModel(modelName: string = 'gemini-1.5-flash') {
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
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    return model;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to initialize model ${modelName}:`, error.message);
      throw new Error(`Failed to initialize AI model: ${error.message}`);
    } else {
      console.error('Unexpected error initializing model:', error);
      throw new Error('Unexpected error initializing Gemini model');
    }
  }
}

export default genAI;
