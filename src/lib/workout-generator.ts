// src/lib/workout-generator.ts
import { getGeminiModel } from './gemini';
import { parseAIResponse, validateWorkoutPlan } from './parse-json';

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

// Helper function to parse caloriesBurn and ensure it's a number
function parseCaloriesBurn(value: any): number {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    // If it's a range like "60-90", take the average
    const match = value.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }
    // If it's just a number string
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Helper function to clean and validate workout plan
function cleanWorkoutPlan(plan: any): any {
  if (!plan.weeklySchedule) return plan;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  days.forEach(day => {
    if (plan.weeklySchedule[day] && plan.weeklySchedule[day].exercises) {
      plan.weeklySchedule[day].exercises = plan.weeklySchedule[day].exercises.map((ex: any) => ({
        ...ex,
        caloriesBurn: parseCaloriesBurn(ex.caloriesBurn)
      }));
      
      // Recalculate total calories
      plan.weeklySchedule[day].totalCaloriesBurn = plan.weeklySchedule[day].exercises.reduce(
        (sum: number, ex: any) => sum + ex.caloriesBurn, 
        0
      );
    }
  });

  return plan;
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

CRITICAL MEDICAL CONSIDERATIONS:
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

**IMPORTANT: MEAL TIMING**
${userProfile.gymTiming ? `
User works out at: ${userProfile.gymTiming}
DO NOT suggest pre/post-workout meals in this workout plan.
The user's diet plan will automatically include meals timed around their workout schedule.
Simply note the workout timing so the diet plan generator can coordinate meal timing.
` : 'Note: Meal timing will be coordinated with the user\'s diet plan'}


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
          "caloriesBurn": 75 (MUST BE A SINGLE INTEGER NUMBER, NOT A RANGE),
          "benefits": "specific benefits for their condition/goal",
          "safetyTips": "Important safety considerations",
          "videoReference": "YouTube search term for proper form"
        }
      ],
      "warmup": "5-10 minute warmup routine",
      "cooldown": "5-10 minute cooldown/stretching",
      "totalCaloriesBurn": number,
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

**CRITICAL: caloriesBurn MUST be a single integer number (e.g., 75), NOT a range (e.g., "60-90"). Calculate the average if needed.**

**IMPORTANT GUIDELINES:**
1. Create 7 DIFFERENT daily workout plans for variety based on the user's goal
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
10. Include calorie burn estimates as INTEGER NUMBERS ONLY
11. Provide safety tips and proper form cues
12. Suggest equipment alternatives for home workouts
13. DO NOT include pre/post workout meal suggestions - meals are handled in the diet plan
14. Focus purely on exercises, form, and safety
15. The workout plan can be Arnold Schwarzenegger Routine or 5x5 (StrongLifts / Starting Strength) or any other relevant proven methodology based on user profile
16. The workout plan can also be HIIT, Tabata, Circuit Training, Yoga, Pilates, Calisthenics, or any other relevant proven methodology based on user profile
17. The workout plan can also be what many youtubers suggest like Athlean-X, FitnessBlender, MadFit, etc. based on user profile

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
    let workoutPlan;
    try {
      workoutPlan = parseAIResponse(result);
      validateWorkoutPlan(workoutPlan);
      workoutPlan = cleanWorkoutPlan(workoutPlan);
    } catch (parseError: any) {
      console.error('Failed to parse/validate workout plan:', parseError.message);
      throw new Error(parseError.message || 'Failed to parse AI response. Please try again.');
    }

    // Clean and validate the plan
    workoutPlan = cleanWorkoutPlan(workoutPlan);

    // Validate required fields
    if (!workoutPlan.weeklySchedule) {
      throw new Error('Invalid workout plan structure');
    }

    console.log('✅ Workout plan validated and cleaned');
    return workoutPlan;
  } catch (error: any) {
    console.error('❌ Error generating workout plan:', error);
    throw new Error(`Failed to generate workout plan: ${error.message}`);
  }
}