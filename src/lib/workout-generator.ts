import { getGeminiModel } from './gemini';

interface UserProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  medicalConditions: string[];
  gymTiming?: string;
  workoutPreference?: 'gym' | 'home' | 'both';
  availableEquipment?: string[];
  experience?: 'beginner' | 'intermediate' | 'advanced';
}

export async function generateWorkoutPlan(userProfile: UserProfile) {
  const prompt = `
You are a certified fitness trainer and physiotherapist. Create a detailed, safe, and effective weekly workout plan for:

**Personal Details:**
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}
- Medical Conditions: ${userProfile.medicalConditions.join(', ') || 'None'}
- Gym Timing: ${userProfile.gymTiming || 'Not specified'}
- Workout Preference: ${userProfile.workoutPreference || 'Both gym and home'}
- Experience Level: ${userProfile.experience || 'beginner'}

**CRITICAL MEDICAL CONSIDERATIONS:**
${userProfile.medicalConditions.length > 0 ? `
This person has: ${userProfile.medicalConditions.join(', ')}
YOU MUST:
- Suggest ONLY exercises that are SAFE for these conditions
- For respiratory issues (asthma, sinus, etc.): Recommend yoga, breathing exercises, low-intensity cardio
- For joint problems: Focus on low-impact exercises, swimming, cycling
- For heart conditions: Emphasize doctor clearance, start with walking, gradual progression
- For diabetes: Include both cardio and strength training with proper timing
- ALWAYS prioritize safety over intensity
` : 'No medical conditions - can suggest full range of exercises'}

**GYM TIMING CONTEXT:**
${userProfile.gymTiming ? `
User works out at: ${userProfile.gymTiming}
- Suggest pre-workout meal timing (30-60 mins before)
- Suggest post-workout meal timing (within 30-60 mins after)
- Adjust exercise intensity based on time of day
` : ''}

Provide a comprehensive workout plan in JSON format:
{
  "weeklySchedule": {
    "monday": {
      "restDay": false,
      "workoutType": "Strength Training / Cardio / Yoga / Rest / Mixed / Weight Training / Calisthenics",
      "duration": "minutes",
      "exercises": [
        {
          "name": "Exercise name",
          "type": "strength/cardio/flexibility/breathing",
          "targetMuscles": ["muscle groups"],
          "sets": number,
          "reps": "number or time",
          "restBetweenSets": "seconds",
          "instructions": "Clear step-by-step instructions",
          "modifications": "Easier variation if needed",
          "equipment": "required equipment or 'bodyweight'",
          "caloriesBurn": estimated_calories,
          "benefits": "specific benefits for their condition/goal",
          "safetyTips": "Important safety considerations",
          "videoReference": "YouTube search term for proper form"
        }
      ],
      "warmup": "5-10 minute warmup routine",
      "cooldown": "5-10 minute cooldown/stretching",
      "totalCaloriesBurn": number,
      "preWorkoutMeal": {
        "timing": "time before workout",
        "foods": ["specific foods with brands if relevant"],
        "reason": "why these foods"
      },
      "postWorkoutMeal": {
        "timing": "time after workout",
        "foods": ["specific foods with brands"],
        "reason": "why these foods"
      }
    }
    // Repeat for tuesday through sunday
  },
  "guidelines": [
    "Important guideline 1",
    "Important guideline 2",
    ...
  ],
  "progressionPlan": {
    "week1-2": "Start with these modifications",
    "week3-4": "Progress to this intensity",
    "week5+": "Advanced progression"
  },
  "warnings": [
    "Medical warning 1",
    "Medical warning 2",
    ...
  ],
  "restAndRecovery": "Importance of rest, sleep recommendations, recovery tips"
}

**IMPORTANT GUIDELINES:**
1. Create 7 DIFFERENT daily workout plans for variety
2. For medical conditions like sinus/asthma: 
   - Emphasize yoga (pranayama, gentle poses)
   - Breathing exercises (alternate nostril breathing, kapalbhati)
   - Low-intensity walking
   - AVOID high-intensity cardio that may trigger symptoms
3. For joint problems: Low-impact exercises only
4. Include proper warm-up and cool-down
5. Adjust intensity based on experience level
6. Provide modifications for exercises
7. Consider gym timing for meal suggestions
8. Include rest days (at least 1-2 per week)
9. For each exercise, specify sets, reps, and rest periods
10. Include calorie burn estimates
11. Provide safety tips and proper form cues
12. Suggest equipment alternatives for home workouts
13. If gym timing is early morning (before 7 AM): Suggest light pre-workout snacks
14. If gym timing is evening: Suggest substantial pre-workout meals

Return ONLY the JSON object, no additional text.
`;

  try {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'];
    let result;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Generating workout plan with: ${modelName}`);
        const model = getGeminiModel(modelName);
        
        const geminiResult = await model.generateContent(prompt);
        const response = geminiResult.response;
        result = response.text();
        
        console.log(`✅ Successfully used model: ${modelName}`);
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed: ${error.message}`);
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('All models failed');
    }

    // Clean up the response
    let cleanedResult = result.trim();
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const workoutPlan = JSON.parse(cleanedResult);

    // Validate required fields
    if (!workoutPlan.weeklySchedule) {
      throw new Error('Invalid workout plan structure');
    }

    return workoutPlan;
  } catch (error: any) {
    console.error('❌ Error generating workout plan:', error);
    throw new Error(`Failed to generate workout plan: ${error.message}`);
  }
}