import { getGeminiModel } from './gemini';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getDoctorResponse(
  messages: ChatMessage[],
  userContext: {
    age: number;
    weight: number;
    height: number;
    medicalConditions: string[];
    currentGoal: string;
  }
) {
  const systemPrompt = `
You are Dr. HealthAI, a caring and knowledgeable medical doctor and nutritionist. You're helping a patient with the following profile:

- Age: ${userContext.age} years
- Weight: ${userContext.weight} kg
- Height: ${userContext.height} cm
- Medical Conditions: ${userContext.medicalConditions.join(', ') || 'None'}
- Current Goal: ${userContext.currentGoal}

**Your Guidelines:**
1. Provide medically accurate, evidence-based advice
2. Be warm, empathetic, and easy to understand
3. Use simple language suitable for all ages
4. Always prioritize patient safety
5. Recommend seeing a doctor in-person for serious concerns
6. Focus on nutrition, lifestyle, and preventive health
7. Be encouraging and supportive
8. Keep responses concise but informative (2-4 paragraphs max)

**Important:** Never provide specific medication recommendations. Always suggest consulting with their personal physician for prescriptions or serious medical concerns.
`;

  try {
    // Convert messages to Gemini format
    const conversationHistory = messages.map(msg => {
      if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else {
        return `Doctor: ${msg.content}`;
      }
    }).join('\n\n');

    const fullPrompt = `${systemPrompt}

Previous conversation:
${conversationHistory}

Respond as Dr. HealthAI to the last user message. Keep your response warm, helpful, and concise (2-4 paragraphs).`;

    console.log('🩺 Calling Gemini for doctor chat...');

    // Try different models with correct naming
    const modelsToTry = [
  'gemini-2.5-flash',          // Latest model for fast, capable tasks
  'gemini-2.5-pro',            // Latest model for complex reasoning
  'gemini-pro',                // General-purpose stable model
];

    let response;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = getGeminiModel(modelName);
        
        const result = await model.generateContent(fullPrompt);
        response = result.response.text();
        
        console.log(`✅ Successfully used model: ${modelName}`);
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        
        // If it's a safety error, return appropriate message
        if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
          return 'I understand your concern. For this specific medical question, I recommend consulting with your healthcare provider in person for personalized advice.';
        }
        
        continue;
      }
    }

    if (!response) {
      console.error('❌ All models failed. Last error:', lastError);
      throw lastError || new Error('No available models');
    }

    return response || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error: any) {
    console.error('❌ Error in doctor chat:', error);
    
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    } else if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
      return 'I understand your concern. For this specific medical question, I recommend consulting with your healthcare provider in person for personalized advice.';
    }
    
    throw new Error('Failed to get doctor response. Please try again.');
  }
}