import { getGeminiModel } from '../gemini';
import { parseAIResponse, validateDietPlan } from '../parse-json';
import type { DietPlanData, NutritionTargets, UserDietProfile } from './types';
import { calculateMealTiming } from './nutrition-targets';

/**
 * Path A — Gemini creative diet generation.
 * Targets are injected so the model stays near scientific macros.
 */
export async function generateGeminiDietPlan(
  userProfile: UserDietProfile,
  targets?: NutritionTargets
): Promise<DietPlanData> {
  const mealTimingInfo = calculateMealTiming(userProfile.gymTiming);

  const targetBlock = targets
    ? `
**MANDATORY NUTRITION TARGETS (hit these closely every day):**
- Daily Calories: ${targets.dailyCalories} kcal (acceptable ${targets.calorieFloor}–${targets.calorieCeiling})
- Daily Protein: ${targets.dailyProtein} g
- Daily Carbs: ${targets.dailyCarbs} g
- Daily Fats: ${targets.dailyFats} g
Do NOT invent very different calorie targets. Use these numbers as dailyCalories/dailyProtein/dailyCarbs/dailyFats.
`
    : '';

  const hostelContext =
    userProfile.livesInHostel && userProfile.messMenuText
      ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility. Here is their mess menu:

${userProfile.messMenuText}

YOU MUST:
1. Create meal plans MOSTLY using ONLY the foods available in the mess menu above
2. Match the meal timings to the mess schedule shown in the menu
3. If the mess menu shows different meals for different days, ensure your weekly plan reflects this variety
4. Do NOT suggest outside foods or restaurants unless the food in the menu is grossly insufficient
5. Work within the mess meal structure (breakfast, lunch, dinner as available)
6. Suggest combinations and portions from mess items to meet nutritional goals
7. If mess food is insufficient, suggest minimal hostel-friendly supplements (fruits, nuts, protein powder, curd, eggs if allowed)

${
  userProfile.gymTiming
    ? `
**WORKOUT TIMING COORDINATION:**
${mealTimingInfo.workoutMealNote}
Coordinate mess meals with workout schedule.
`
    : ''
}

The meal plan must be practical and based on what's actually available in their hostel mess.
`
      : userProfile.livesInHostel
        ? `
**IMPORTANT: USER LIVES IN HOSTEL**
The user lives in a hostel with mess facility but hasn't provided a menu.
- Create a realistic hostel mess-style meal plan with common hostel foods
- Keep meals simple and mess-friendly
- Suggest easy-to-store supplementary items if needed

${
  userProfile.gymTiming
    ? `
**WORKOUT TIMING COORDINATION:**
${mealTimingInfo.workoutMealNote}
`
    : ''
}
`
        : userProfile.gymTiming
          ? `
**WORKOUT TIMING COORDINATION:**
User works out at: ${userProfile.gymTiming}
${mealTimingInfo.workoutMealNote}

IMPORTANT: Structure meals around workout timing:
- Pre-workout meal should be lighter, carb-focused, easily digestible
- Post-workout meal should be protein-rich with good carbs for recovery
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
${userProfile.gymTiming ? `- Workout Time: ${userProfile.gymTiming}` : ''}

**Dietary Restrictions:** ${userProfile.dietaryRestrictions.length > 0 ? userProfile.dietaryRestrictions.join(', ') : 'None'}
**Medical Conditions:** ${userProfile.medicalConditions.length > 0 ? userProfile.medicalConditions.join(', ') : 'None'}

${userProfile.additionalInfo?.goalDescription ? `**User's Goal Description:** ${userProfile.additionalInfo.goalDescription}` : ''}
${userProfile.additionalInfo?.challenges ? `**Challenges Faced:** ${userProfile.additionalInfo.challenges}` : ''}
${userProfile.additionalInfo?.expectations ? `**User's Expectations:** ${userProfile.additionalInfo.expectations}` : ''}

${hostelContext}
${targetBlock}

**MEAL STRUCTURE FOR THIS USER:**
Number of Meals: ${mealTimingInfo.numberOfMeals}
Meal Structure: ${mealTimingInfo.mealStructure}

Please provide a comprehensive 7-day rotating diet plan in the following JSON format:
{
  "dailyCalories": number,
  "dailyProtein": number,
  "dailyCarbs": number,
  "dailyFats": number,
  "weeklyPlan": {
    "monday": {
      "meals": [
        {
          "name": "Meal name",
          "time": "suggested time",
          "foods": [
            {
              "item": "food name",
              "quantity": "specific amount",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fats": number,
              "estimatedCost": number,
              "brand": "community-recommended brand for their budget OR Hostel Mess only if from mess",
              "recipe": "numbered step-by-step recipe with times/temps; if mess say Available in mess with how to portion",
              "benefits": "why this food helps"
            }
          ],
          "totalCalories": number,
          "totalProtein": number,
          "totalCarbs": number,
          "totalFats": number,
          "totalCost": number
        }
      ],
      "dailyTotal": { "calories": number, "protein": number, "carbs": number, "fats": number, "cost": number }
    }
  },
  "recommendations": ["..."],
  "supplements": [{ "name": "", "dosage": "", "reason": "", "timing": "" }],
  "hydration": "...",
  "exerciseRecommendations": "...",
  "progressTracking": "...",
  "cautionaryNotes": "..."
}

**Important Guidelines:**
1. Create ${mealTimingInfo.numberOfMeals} meals/day: ${mealTimingInfo.mealStructure}
2. 7 DIFFERENT daily plans — NO copy-paste days. Rotate cuisines/styles so the user does not get bored.
3. STRICTLY avoid foods that worsen medical conditions
4. ${
    userProfile.livesInHostel
      ? 'Strictly use mostly mess menu items for main meals; mark brand as Hostel Mess'
      : `Use locally available affordable foods for ${userProfile.location?.city || 'the area'}, ${userProfile.location?.country || 'India'}`
  }
5. Include detailed numbered recipes (ingredients + steps + timing). For store foods suggest brands that are commonly recommended for their budget class in India (e.g. Amul dairy, Aashirvaad/Pillsbury atta, Quaker/Saffola oats, Pintola peanut butter, Nutrela soya, Nakpro/MuscleBlaze protein on deals) — NEVER invent luxury brands. Only use "Hostel Mess" when the user actually lives in a hostel and the item is from mess.
6. ${
    userProfile.gymTiming
      ? `CRITICAL GYM TIMING (${userProfile.gymTiming}): ${mealTimingInfo.workoutMealNote}
         Meal names MUST literally include "Pre-Workout" and "Post-Workout" where applicable (e.g. "Pre-Workout Snack", "Post-Workout Meal"). Never rename them to generic Breakfast/Snack.`
      : 'Standard meal timing (no gym slot provided)'
  }
7. Respect ${userProfile.budget} budget; costs in INR
8. Adhere to dietary restrictions strictly
9. ${userProfile.livesInHostel ? 'Hostel mode ON' : 'User does NOT live in hostel — do NOT mention hostel mess, do NOT brand foods as Hostel Mess'}
10. VARIETY & NAMED PRODUCE (mandatory):
    - Name specific vegetables every day (e.g. spinach/palak, carrot, broccoli, capsicum, tomato, cucumber, beans, bottle gourd) — not just "sabzi".
    - Name specific fruits (banana, orange, guava, apple, papaya, pomegranate, amla) — not just "fruit".
    - Across the week include interesting meals at least 2–3 times: pesto protein pasta, oats+peanut butter+banana, grilled paneer with broccoli, veggie omelette, sweet potato chaat, dal+palak, curd+fruit bowl.
    - Do NOT serve the exact same breakfast/lunch combo all 7 days.
11. MICRONUTRIENTS (not protein-only):
    - Vitamin C: citrus, guava, amla, capsicum, lemon with meals.
    - Vitamin A: carrot, spinach, sweet potato, papaya.
    - B vitamins: oats, eggs, dals, bananas, milk.
    - Vitamin D / calcium awareness: fortified toned milk (mention brand + fat % when suggesting milk, e.g. Amul toned ~3% fat / double-toned ~1.5%), sunlight note in recommendations; mushrooms/eggs when allowed.
    - Include oats, peanut butter, and fruit regularly — not only whey/chicken/paneer.
    - Put micronutrient notes in food "benefits" fields.
12. Return ONLY valid JSON, no markdown fences

Return ONLY the JSON object, no additional text.
`;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.');
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'];
  let result: string | undefined;
  let lastError: any;
  let usedModel = '';

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);
      const model = getGeminiModel(modelName);
      const geminiResult = await model.generateContent(prompt);
      result = geminiResult.response.text();
      usedModel = modelName;
      console.log(`✅ Successfully used model: ${modelName}`);
      break;
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Model ${modelName} failed: ${error.message}`);
      if (error.message?.includes('SAFETY') || error.message?.includes('block')) throw error;
      if (
        !error.message?.includes('model') &&
        !error.message?.includes('404') &&
        !error.message?.includes('not found')
      ) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error(
      `No available Gemini models found. Last error: ${lastError?.message || 'unknown'}`
    );
  }

  const dietPlan = parseAIResponse(result);
  validateDietPlan(dietPlan);
  console.log(`✅ Gemini diet plan parsed (model=${usedModel})`);
  return dietPlan as DietPlanData;
}
