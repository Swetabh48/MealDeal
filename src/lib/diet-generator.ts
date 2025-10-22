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
  livesInHostel?: boolean;
  messMenuText?: string;
}

export async function generateDietPlan(userProfile: UserProfile) {
  const hostelContext = userProfile.livesInHostel && userProfile.messMenuText
    ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility. Here is their mess menu:

${userProfile.messMenuText}

YOU MUST:
1. Create meal plans NOT NECESSARILY BUT MOSTLY using ONLY the foods available in the mess menu above
2. Match the meal timings to the mess schedule shown in the menu
3. If the mess menu shows different meals for different days, ensure your weekly plan reflects this variety
4. Do NOT suggest outside foods or restaurants unless the food in the menu is grossly insufficient to meet their nutritional needs
5. Work within the mess meal structure (breakfast, lunch, dinner as available)
6. Suggest combinations and portions from mess items to meet nutritional goals
7. If mess food is insufficient for their goals, you may suggest minimal supplementary foods that are easy to keep in hostel (fruits, nuts, protein powder, etc.)

The meal plan must be practical and based on what's actually available in their hostel mess.
`
    : userProfile.livesInHostel
    ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility but hasn't provided a menu. 
- Create a realistic hostel mess-style meal plan with common hostel foods
- Keep meals simple and mess-friendly
- Suggest easy-to-store supplementary items if needed
`
    : '';
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

${hostelContext}


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
              "brand": "specific brand or store name (e.g., 'Aashirvaad Atta', 'Local Market', 'Amul Butter'), or 'Hostel Mess' if from mess",
              "recipe": "detailed recipe with preparation instructions in points in simple language, or 'Available in mess' if from mess menu",
              "benefits":  "health benefits and why this is good for their condition"
            }
          ],
          "totalCalories": number,
          "totalProtein": number,
          "totalCarbs": number,
          "totalFats": number,
          "totalCost": number(in INR or local currency)
        }
      ],
      "dailyTotal": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "cost": number(in INR or local currency)
      }
    },
    // Repeat for tuesday, wednesday, thursday, friday, saturday, sunday
  },
  "recommendations": [
    "Recommendation 1: [Title] - [Specific actionable advice]",
    "Recommendation 2: [Title] - [Specific actionable advice]",
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
  "exerciseRecommendations": "brief exercise suggestions aligned with their age and conditions",
  "progressTracking": "what metrics to track and how often",
  "cautionaryNotes": "Important medical cautions specific to their conditions or when to consult a doctor"
}

**Important Guidelines:**
1. Create 7 DIFFERENT daily plans to provide variety throughout the week and keep on rotating every week
2. STRICTLY AVOID all foods that worsen their medical conditions
3.${userProfile.livesInHostel 
  ? 'Strictly use only mess menu items for main meals' 
  : `Use foods that are locally available and affordable in ${
      userProfile.location?.city && userProfile.location?.country 
        ? `${userProfile.location.city}, ${userProfile.location.country}`
        : 'your area'
    }`}
4. ${userProfile.livesInHostel ? 'If mess food lacks nutrition, suggest easy hostel-friendly supplements (fruits, nuts, protein powder)' : 'Include specific brand names and alternatives(e.g., "Fortune Rice Bran Oil", "Britannia Brown Bread", "Local vegetable vendor")'} 
5. Consider the ${userProfile.budget} class budget - be realistic with costs and use only INR or local currency 
6. Address their specific goals, challenges, and expectations mentioned above
7. Ensure the plan is medically sound and safe given their medical conditions
8. Include proper macro and micronutrient balance
9. Make it practical and easy to follow for a ${userProfile.age}-year-old ${userProfile.livesInHostel ? 'hostel resident' : 'person'}
10. Include 5 meals per day: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
11. Provide exact quantities, measurements, and nutritional information
12. Include detailed recipes that are simple to prepare
13. Consider cultural and regional food preferences for ${userProfile.location.country}
14. If they have dietary restrictions, strictly adhere to them
15. For medical conditions, provide medically appropriate food choices and justifications
16. Include meal timing that supports their goal and activity level
17. Include alternative options if the primary food might cause issues
18. The price can be estimated based on local market rates and need not be exact and displayed in terms of kg or per piece as relevant


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