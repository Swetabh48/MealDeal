import openai from './openai';

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
- Location: ${userProfile.location.city}, ${userProfile.location.state}, ${userProfile.location.country}

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
2. Use foods that are locally available and affordable in ${userProfile.location.city}, ${userProfile.location.state}
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a certified nutritionist and medical doctor with expertise in Indian nutrition, Ayurveda, and modern dietary science. You specialize in creating personalized, culturally appropriate, and medically sound diet plans. You understand local food availability, budget constraints, and regional preferences across different parts of the world, especially India.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const dietPlan = JSON.parse(completion.choices[0].message.content || '{}');
    return dietPlan;
  } catch (error: any) {
    console.error('Error generating diet plan:', error);
    throw new Error(`Failed to generate diet plan: ${error.message}`);
  }
}