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
  gymTiming?: string;
}

// Helper function to calculate meal timing based on gym schedule
function calculateMealTiming(gymTiming?: string) {
  if (!gymTiming) {
    return {
      numberOfMeals: 5,
      mealStructure: 'Standard: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner',
      workoutMealNote: 'No workout schedule provided - standard meal timing'
    };
  }

  const timingMap: Record<string, any> = {
    'early-morning': {
      numberOfMeals: 6,
      mealStructure: 'Pre-Workout Snack (4:30 AM), Post-Workout Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote: 'Pre-workout: Light, easily digestible snack 30-45 mins before (4:30-5:00 AM). Post-workout: Protein-rich breakfast within 30-60 mins after workout (6:30-7:30 AM).'
    },
    'morning': {
      numberOfMeals: 6,
      mealStructure: 'Breakfast (6:30 AM), Pre-Workout Snack (8:30 AM), Post-Workout Meal (10:30 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote: 'Pre-workout: Light snack 30-45 mins before workout (8:30-9:00 AM). Post-workout: Protein & carb meal within 30-60 mins after (10:00-11:00 AM).'
    },
    'late-morning': {
      numberOfMeals: 5,
      mealStructure: 'Breakfast (7:00 AM), Pre-Workout Snack (10:30 AM), Post-Workout Lunch (1:00 PM), Evening Snack (5:00 PM), Dinner (8:00 PM)',
      workoutMealNote: 'Pre-workout: Light snack before workout (10:30-11:00 AM). Post-workout: Make lunch protein-rich and have within 60 mins after workout (12:30-1:30 PM).'
    },
    'afternoon': {
      numberOfMeals: 5,
      mealStructure: 'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (12:30 PM), Pre-Workout Snack (3:00 PM), Post-Workout Dinner (6:00 PM)',
      workoutMealNote: 'Pre-workout: Light snack 30-45 mins before (3:00-3:30 PM). Post-workout: Make dinner protein-rich within 60 mins after workout (5:30-6:30 PM).'
    },
    'evening': {
      numberOfMeals: 6,
      mealStructure: 'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Pre-Workout Snack (4:30 PM), Post-Workout Meal (6:30 PM), Light Dinner (8:30 PM)',
      workoutMealNote: 'Pre-workout: Carb-focused snack 45-60 mins before (4:00-4:30 PM). Post-workout: Protein & carb meal within 30-60 mins after (6:00-6:30 PM). Light dinner later (8:30 PM).'
    },
    'night': {
      numberOfMeals: 6,
      mealStructure: 'Breakfast (7:00 AM), Mid-Morning Snack (10:00 AM), Lunch (1:00 PM), Evening Snack (5:00 PM), Pre-Workout Snack (7:30 PM), Post-Workout Dinner (9:30 PM)',
      workoutMealNote: 'Pre-workout: Light, easily digestible snack 30-45 mins before (7:00-7:30 PM). Post-workout: Protein-rich but lighter dinner within 60 mins after (9:00-10:00 PM).'
    },
    'flexible': {
      numberOfMeals: 5,
      mealStructure: 'Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner (adjust based on actual workout time)',
      workoutMealNote: 'Since timing varies, ensure you eat a light snack 30-60 mins before workout and a protein-rich meal within 60 mins after, adjusting your regular meals accordingly.'
    }
  };

  return timingMap[gymTiming] || timingMap['flexible'];
}

export async function generateDietPlan(userProfile: UserProfile) {
  const mealTimingInfo = calculateMealTiming(userProfile.gymTiming);
  
  const hostelContext = userProfile.livesInHostel && userProfile.messMenuText
    ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility. Here is their mess menu:

${userProfile.messMenuText}

YOU MUST:
1. Create meal plans MOSTLY using ONLY the foods available in the mess menu above
2. Match the meal timings to the mess schedule shown in the menu
3. If the mess menu shows different meals for different days, ensure your weekly plan reflects this variety
4. Do NOT suggest outside foods or restaurants unless the food in the menu is grossly insufficient to meet their nutritional needs
5. Work within the mess meal structure (breakfast, lunch, dinner as available)
6. Suggest combinations and portions from mess items to meet nutritional goals
7. If mess food is insufficient for their goals, you may suggest minimal supplementary foods that are easy to keep in hostel (fruits, nuts, protein powder, etc.)

${userProfile.gymTiming ? `
**WORKOUT TIMING COORDINATION:**
${mealTimingInfo.workoutMealNote}
Coordinate mess meals with workout schedule. If mess timing doesn't align perfectly, suggest portable snacks from mess or easy-to-store items.
` : ''}

The meal plan must be practical and based on what's actually available in their hostel mess.
`
    : userProfile.livesInHostel
    ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility but hasn't provided a menu. 
- Create a realistic hostel mess-style meal plan with common hostel foods
- Keep meals simple and mess-friendly
- Suggest easy-to-store supplementary items if needed

${userProfile.gymTiming ? `
**WORKOUT TIMING COORDINATION:**
${mealTimingInfo.workoutMealNote}
` : ''}
`
    : userProfile.gymTiming ? `
**WORKOUT TIMING COORDINATION:**
User works out at: ${userProfile.gymTiming}
${mealTimingInfo.workoutMealNote}

IMPORTANT: Structure meals around workout timing:
- Pre-workout meal should be lighter, carb-focused, easily digestible
- Post-workout meal should be protein-rich with good carbs for recovery
- Time other meals to not interfere with workout performance
` : '';

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
${userProfile.gymTiming ? `- Workout Time: ${userProfile.gymTiming}` : ''}

**Dietary Restrictions:** ${userProfile.dietaryRestrictions.length > 0 ? userProfile.dietaryRestrictions.join(', ') : 'None'}
**Medical Conditions:** ${userProfile.medicalConditions.length > 0 ? userProfile.medicalConditions.join(', ') : 'None'}

${userProfile.additionalInfo?.goalDescription ? `**User's Goal Description:** ${userProfile.additionalInfo.goalDescription}` : ''}
${userProfile.additionalInfo?.challenges ? `**Challenges Faced:** ${userProfile.additionalInfo.challenges}` : ''}
${userProfile.additionalInfo?.expectations ? `**User's Expectations:** ${userProfile.additionalInfo.expectations}` : ''}

${hostelContext}

**MEAL STRUCTURE FOR THIS USER:**
Number of Meals: ${mealTimingInfo.numberOfMeals}
Meal Structure: ${mealTimingInfo.mealStructure}

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
          "name": "Meal name (e.g., Pre-Workout Snack, Post-Workout Breakfast, Breakfast, etc.)",
          "time": "suggested time based on structure above",
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
              "benefits": "health benefits and why this is good for their condition"
            }
          ],
          "totalCalories": number,
          "totalProtein": number,
          "totalCarbs": number,
          "totalFats": number,
          "totalCost": number (in INR or local currency)
        }
      ],
      "dailyTotal": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "cost": number (in INR or local currency)
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
  "hydration": "detailed water intake recommendation with timing, especially around workout if applicable",
  "exerciseRecommendations": "brief exercise suggestions aligned with their age and conditions",
  "progressTracking": "what metrics to track and how often",
  "cautionaryNotes": "Important medical cautions specific to their conditions or when to consult a doctor"
}

**Important Guidelines:**
1. Create ${mealTimingInfo.numberOfMeals} meals per day following this structure: ${mealTimingInfo.mealStructure}
2. Create 7 DIFFERENT daily plans to provide variety throughout the week
3. STRICTLY AVOID all foods that worsen their medical conditions
4. ${userProfile.livesInHostel 
  ? 'Strictly use only mess menu items for main meals' 
  : `Use foods that are locally available and affordable in ${
      userProfile.location?.city && userProfile.location?.country 
        ? `${userProfile.location.city}, ${userProfile.location.country}`
        : 'your area'
    }`}
5. ${userProfile.livesInHostel ? 'If mess food lacks nutrition, suggest easy hostel-friendly supplements (fruits, nuts, protein powder)' : 'Include specific brand names and alternatives (e.g., "Fortune Rice Bran Oil", "Britannia Brown Bread", "Local vegetable vendor")'} 
6. ${userProfile.gymTiming ? `CRITICAL: ${mealTimingInfo.workoutMealNote}` : 'Standard meal timing throughout the day'}
7. Consider the ${userProfile.budget} class budget - be realistic with costs and use only INR or local currency 
8. Address their specific goals, challenges, and expectations mentioned above
9. Ensure the plan is medically sound and safe given their medical conditions
10. Include proper macro and micronutrient balance
11. Make it practical and easy to follow for a ${userProfile.age}-year-old ${userProfile.livesInHostel ? 'hostel resident' : 'person'}
12. Provide exact quantities, measurements, and nutritional information
13. Include detailed recipes that are simple to prepare
14. Consider cultural and regional food preferences for ${userProfile.location.country}
15. If they have dietary restrictions, strictly adhere to them
16. For medical conditions, provide medically appropriate food choices and justifications
17. ${userProfile.gymTiming ? 'Pre-workout meals should be lighter and carb-focused. Post-workout meals should be protein-rich for recovery.' : ''}
18. The price can be estimated based on local market rates and need not be exact

Return ONLY the JSON object, no additional text.
`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.');
    }

    console.log('🤖 Calling Gemini AI for diet plan generation...');
    console.log(`📊 Meal structure: ${mealTimingInfo.numberOfMeals} meals - ${mealTimingInfo.mealStructure}`);

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'];

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
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed: ${error.message}`);

        if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
          throw error;
        }

        if (!error.message?.includes('model') && 
            !error.message?.includes('404') && 
            !error.message?.includes('not found')) {
          throw error;
        }
        continue;
      }
    }

    if (!result) {
      console.error('❌ All Gemini models failed. Last error:', lastError);
      throw new Error(`No available Gemini models found. Please check your API key and try again. Last error: ${lastError?.message}`);
    }

    console.log('✅ Gemini AI response received');

    let cleanedResult = result.trim();

    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let dietPlan;
    try {
      dietPlan = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('Failed to parse Gemini response. First 500 chars:', cleanedResult.substring(0, 500));
      throw new Error('Failed to parse AI response. The AI returned invalid JSON. Please try again.');
    }

    if (!dietPlan.dailyCalories || !dietPlan.weeklyPlan) {
      throw new Error('Invalid diet plan structure received from AI. Missing required fields.');
    }

    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const missingDays = requiredDays.filter(day => !dietPlan.weeklyPlan[day]);
    if (missingDays.length > 0) {
      console.warn('Warning: Missing days in diet plan:', missingDays);
    }

    console.log(`✅ Diet plan validated successfully (generated by ${usedModel})`);
    console.log(`✅ Meal structure: ${mealTimingInfo.numberOfMeals} meals coordinated with workout timing`);
    return dietPlan;

  } catch (error: any) {
    console.error('❌ Error generating diet plan:', error);

    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local.');
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please wait a moment and try again.');
    } else if (error.message?.includes('rate limit') || error.message?.includes('RATE_LIMIT')) {
      throw new Error('Too many requests. Please wait 1-2 minutes and try again.');
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try generating the plan again.');
    } else if (error.message?.includes('SAFETY') || error.message?.includes('block')) {
      throw new Error('Content was blocked by safety filters. Please try with different input or try again.');
    }

    throw new Error(`Failed to generate diet plan: ${error.message || 'Unknown error'}`);
  }
}