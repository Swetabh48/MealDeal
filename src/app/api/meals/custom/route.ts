// src/app/api/meals/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CustomMeal from '@/models/CustomMeal';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, mealType, mealName, foods, isCustom } = body;

    console.log('🍽️ Logging custom meal:', mealName);

    // Use AI to enrich the meal data with nutritional information
    console.log('🤖 AI analyzing food items...');
    const enrichedFoods = await enrichFoodData(foods);
    
    const nutritionAnalysis = await analyzeMealNutrition(enrichedFoods);
    console.log('✅ Nutrition analysis complete:', nutritionAnalysis.totalCalories, 'calories');

    await connectDB();
    
    const customMeal = await CustomMeal.create({
      userId: session.user.id,
      date: new Date(date),
      mealType,
      mealName,
      foods: enrichedFoods,
      totalCalories: nutritionAnalysis.totalCalories,
      isCustom,
      nutritionAnalysis
    });

    console.log('✅ Custom meal saved to database');

    return NextResponse.json({ 
      customMeal,
      message: 'Custom meal logged successfully' 
    });
  } catch (error: any) {
    console.error('❌ Custom meal logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log custom meal', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get custom meals for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customMeals = await CustomMeal.find({
      userId: session.user.id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    return NextResponse.json({ customMeals });
  } catch (error) {
    console.error('Fetching custom meals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom meals' },
      { status: 500 }
    );
  }
}

async function enrichFoodData(foods: any[]) {
  try {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro'];
    
    const prompt = `
Analyze the following food items and provide detailed nutritional information for each:

${foods.map((f, i) => `${i + 1}. ${f.item} - ${f.quantity} ${f.brand ? `(Brand: ${f.brand})` : ''}`).join('\n')}

For each item, provide in JSON format:
{
  "foods": [
    {
      "item": "name",
      "quantity": "amount",
      "brand": "brand name or store",
      "calories": estimated calories (number),
      "protein": grams (number),
      "carbs": grams (number),
      "fats": grams (number),
      "healthScore": 1-10 rating based on nutritional value,
      "healthNote": "brief note about this food choice"
    }
  ]
}

Be accurate with Indian food items and brands. Return ONLY the JSON.`;

    let response;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        response = result.response.text();
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All models failed');
    }
    
    let cleanedResult = response.trim();
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const enrichedData = JSON.parse(cleanedResult);
    return enrichedData.foods;
  } catch (error) {
    console.error('Error enriching food data:', error);
    // Return original data if AI fails
    return foods.map(f => ({
      ...f,
      protein: 0,
      carbs: 0,
      fats: 0,
      healthScore: 5,
      healthNote: 'Unable to analyze nutritional data'
    }));
  }
}

async function analyzeMealNutrition(foods: any[]) {
  const totalProtein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalFats = foods.reduce((sum, f) => sum + (f.fats || 0), 0);
  const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  
  const avgHealthScore = foods.reduce((sum, f) => sum + (f.healthScore || 5), 0) / foods.length;

  return {
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFats: Math.round(totalFats * 10) / 10,
    totalCalories: Math.round(totalCalories),
    macroRatio: {
      protein: Math.round((totalProtein * 4 / totalCalories) * 100) || 0,
      carbs: Math.round((totalCarbs * 4 / totalCalories) * 100) || 0,
      fats: Math.round((totalFats * 9 / totalCalories) * 100) || 0
    },
    healthScore: Math.round(avgHealthScore),
    recommendation: getHealthRecommendation(avgHealthScore)
  };
}

function getHealthRecommendation(score: number): string {
  if (score >= 8) return 'Excellent food choice! Great nutritional balance.';
  if (score >= 6) return 'Good choice, but consider adding more nutrients.';
  if (score >= 4) return 'Moderate choice. Try to include healthier options next time.';
  return 'Consider choosing more nutritious alternatives for better health.';
}