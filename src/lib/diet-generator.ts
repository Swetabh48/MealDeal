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
}

export async function generateDietPlan(userProfile: UserProfile) {
  const prompt = `
You are a certified nutritionist and doctor. Create a detailed, science-based, doctor-approved diet plan for the following person:

**Personal Details:**
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm
- Current Weight: ${userProfile.weight} kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}
- Budget: ${userProfile.budget} class
- Location: ${userProfile.location.city}, ${userProfile.location.state}, ${userProfile.location.country}

**Dietary Restrictions:** ${userProfile.dietaryRestrictions.join(', ') || 'None'}
**Medical Conditions:** ${userProfile.medicalConditions.join(', ') || 'None'}

Please provide a comprehensive diet plan in the following JSON format:
{
  "dailyCalories": number,
  "dailyProtein": number (grams),
  "dailyCarbs": number (grams),
  "dailyFats": number (grams),
  "meals": [
    {
      "name": "Breakfast/Lunch/Dinner/Snack",
      "time": "suggested time",
      "foods": [
        {
          "item": "food name (locally available in their region)",
          "quantity": "specific amount",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number,
          "estimatedCost": number (in local currency)
          "recipe": "detailed recipe with preparation instructions"
        }
      ],
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFats": number,
      "totalCost": number
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "supplements": ["if needed, based on deficiencies"],
  "hydration": "water intake recommendation"
}

**Important Guidelines:**
1. Use foods that are locally available and affordable in ${userProfile.location.city}, ${userProfile.location.state}
2. Consider the ${userProfile.budget} class budget - be realistic with costs
3. Ensure the plan is medically sound and safe
4. Include proper macro and micronutrient balance
5. Consider their medical conditions and dietary restrictions
6. Make it practical and easy to follow for a person based on their age and lifestyle
7. Include specific quantities and measurements
8. Provide exact caloric and nutritional information
9. Provide the recipe along with the diet plan in proper detail

Return ONLY the JSON object, no additional text.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a certified nutritionist and medical doctor specializing in personalized diet plans. Always provide scientifically accurate, safe, and practical advice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const dietPlan = JSON.parse(completion.choices[0].message.content || '{}');
    return dietPlan;
  } catch (error) {
    console.error('Error generating diet plan:', error);
    throw new Error('Failed to generate diet plan');
  }
}