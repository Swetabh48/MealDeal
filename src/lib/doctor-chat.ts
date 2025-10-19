import openai from './openai';

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
3. Use simple language suitable for elderly patients
4. Always prioritize patient safety
5. Recommend seeing a doctor in-person for serious concerns
6. Focus on nutrition, lifestyle, and preventive health
7. Be encouraging and supportive
8. Keep responses concise but informative (2-4 paragraphs max)

**Important:** Never provide specific medication recommendations. Always suggest consulting with their personal physician for prescriptions or serious medical concerns.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error in doctor chat:', error);
    throw new Error('Failed to get doctor response');
  }
}