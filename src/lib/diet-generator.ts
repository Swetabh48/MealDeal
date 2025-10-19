import { getGeminiModel } from './gemini';

interface UserProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  dietaryRestrictions: string[];
  medicalConditions: string[];
  budget: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  additionalInfo?: {
    goalDescription?: string;
    challenges?: string;
    expectations?: string;
  };
}

export async function generateDietPlan(userProfile: UserProfile) {
  const prompt = `
You are a certified nutritionist and medical doctor. Create a detailed, science-based, doctor-approved weekly diet plan for the following person:

**Personal Details:**
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm
- Current Weight: ${userProfile.weight} kg
- Activity Level: ${userProfile.activityLevel}
- Primary Goal: ${userProfile.goal}
- Budget: ${userProfile.budget} class
- Location: ${userProfile.location.city || 'Not specified'}, ${userProfile.location.state || 'Not specified'}, ${userProfile.location.country}

**Dietary Restrictions:** ${userProfile.dietaryRestrictions.length > 0 ? userProfile.dietaryRestrictions.join(', ') : 'None'}
**Medical Conditions:** ${userProfile.medicalConditions.length > 0 ? userProfile.medicalConditions.join(', ') : 'None'}

${userProfile.additionalInfo?.goalDescription ? `**User's Goal Description:** ${userProfile.additionalInfo.goalDescription}` : ''}
${userProfile.additionalInfo?.challenges ? `**Challenges Faced:** ${userProfile.additionalInfo.challenges}` : ''}
${userProfile.additionalInfo?.expectations ? `**User's Expectations:** ${userProfile.additionalInfo.expectations}` : ''}

Please provide a comprehensive 7-day rotating diet plan in the following JSON format:
{
  "dailyCalories": number,
  "dailyProtein": number (grams),
  "dailyCarbs": number (grams),
  "dailyFats": number (grams),
  "weeklyPlan": {
    "monday": {
      "meals": [
        {
          "name": "Breakfast/Mid-Morning Snack/Lunch/Evening Snack/Dinner",
          "time": "suggested time (e.g., 8:00 AM)",
          "foods": [
            {
              "item": "food name (locally available)",
              "quantity": "specific amount (e.g., 2 chapatis, 1 cup, 100g)",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fats": number,
              "estimatedCost": number (in INR or local currency),
              "recipe": "detailed recipe with preparation instructions",
              "benefits": "health benefits of this food"
            }
          ],
          "totalCalories": number,
          "totalProtein": number,
          "totalCarbs": number,
          "totalFats": number,
          "totalCost": number
        }
      ],
      "dailyTotal": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "cost": number
      }
    },
    // Repeat for tuesday, wednesday, thursday, friday, saturday, sunday
  },
  "recommendations": [
    "recommendation 1 - specific and actionable",
    "recommendation 2 - specific and actionable",
    ...
  ],
  "supplements": [
    {
      "name": "supplement name",
      "dosage": "recommended dosage",
      "reason": "why this is needed",
      "timing": "when to take"
    }
  ],
  "hydration": "detailed water intake recommendation with timing",
  "exerciseRecommendations": "brief exercise suggestions aligned with their activity level and goals",
  "progressTracking": "what metrics to track and how often",
  "cautionaryNotes": "any medical cautions or when to consult a doctor"
}

**Important Guidelines:**
1. Create 7 DIFFERENT daily plans to provide variety throughout the week
2. Use foods that are locally available and affordable in ${userProfile.location.city || userProfile.location.country}
3. Consider the ${userProfile.budget} class budget - be realistic with costs
4. Address their specific goals, challenges, and expectations mentioned above
5. Ensure the plan is medically sound and safe given their medical conditions
6. Include proper macro and micronutrient balance
7. Make it practical and easy to follow for a ${userProfile.age}-year-old
8. Include 5 meals per day: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
9. Provide exact quantities, measurements, and nutritional information
10. Include detailed recipes that are simple to prepare
11. Consider cultural and regional food preferences for ${userProfile.location.country}
12. If they have dietary restrictions, strictly adhere to them
13. For medical conditions, provide medically appropriate food choices
14. Include meal timing that supports their goal and activity level

Return ONLY the JSON object, no additional text.
`;

   try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file. Get your key from https://aistudio.google.com/app/apikey');
    }

    console.log('🤖 Calling Gemini AI for diet plan generation...');

    // Try different Gemini models with correct naming
    const modelsToTry = [
  'gemini-2.5-flash',          // Latest model for fast, capable tasks
  'gemini-2.5-pro',            // Latest model for complex reasoning
  'gemini-pro',                // General-purpose stable model
];

    let result;
    let lastError;
    let usedModel = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = getGeminiModel(modelName);
        
        const geminiResult = await model.generateContent(prompt);
        const response = geminiResult.response;
        result = response.text();
        usedModel = modelName;
        
        console.log(`✅ Successfully used model: ${modelName}`);
        break; // Success! Exit the loop
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        
        // If it's a safety/content error, throw immediately (don't try other models)
        if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
          throw error;
        }
        
        // If it's not a model availability error, throw immediately
        if (!error.message?.includes('model') && 
            !error.message?.includes('404') && 
            !error.message?.includes('not found')) {
          throw error;
        }
        continue; // Try next model
      }
    }

    if (!result) {
      console.error('❌ All Gemini models failed. Last error:', lastError);
      throw new Error(`No available Gemini models found. Please check your API key and try again. Last error: ${lastError?.message}`);
    }

    console.log('✅ Gemini AI response received');

    // Clean up the response - remove markdown code blocks if present
    let cleanedResult = result.trim();
    
    // Remove markdown code blocks
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Try to parse the JSON
    let dietPlan;
    try {
      dietPlan = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Failed to parse Gemini response. First 500 chars:', cleanedResult.substring(0, 500));
      throw new Error('Failed to parse AI response. The AI returned invalid JSON. Please try again.');
    }
    
    // Validate the response has required fields
    if (!dietPlan.dailyCalories || !dietPlan.weeklyPlan) {
      throw new Error('Invalid diet plan structure received from AI. Missing required fields.');
    }

    // Validate that all days are present
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const missingDays = requiredDays.filter(day => !dietPlan.weeklyPlan[day]);
    if (missingDays.length > 0) {
      console.warn('Warning: Missing days in diet plan:', missingDays);
    }

    console.log(`✅ Diet plan validated successfully (generated by ${usedModel})`);
    return dietPlan;

  } catch (error: any) {
    console.error('❌ Error generating diet plan:', error);
    
    // Provide specific error messages
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local. Get a free key from https://aistudio.google.com/app/apikey');
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please wait a moment and try again, or check your quota at https://aistudio.google.com/');
    } else if (error.message?.includes('rate limit') || error.message?.includes('RATE_LIMIT')) {
      throw new Error('Too many requests. Please wait 1-2 minutes and try again.');
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try generating the plan again.');
    } else if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
      throw new Error('Content was blocked by safety filters. Please try with different input or try again.');
    } else if (error.message?.includes('model') || error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('Gemini model not available. Please check your API key is valid and has access to Gemini models. Get a key from https://aistudio.google.com/app/apikey');
    }
    
    throw new Error(`Failed to generate diet plan: ${error.message || 'Unknown error'}`);
  }
}