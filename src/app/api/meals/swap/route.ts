import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import User from '@/models/User';
import { filterFoods, findFoodEntry } from '@/lib/diet/food-database';
import { expandRecipeIfShort } from '@/lib/diet/expand-recipe';
import { pickBrand } from '@/lib/diet/brand-picker';
import { withGroceryList } from '@/lib/diet/grocery-list';
import { sanitizePlanBranding } from '@/lib/diet/validator';
import { getGeminiModel } from '@/lib/gemini';
import type { DietPlanData, FoodItem, UserDietProfile } from '@/lib/diet/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function rulesSwap(mealName: string, restrictions: string[], conditions: string[], budget: string): FoodItem[] {
  const isPre = /pre[- ]?workout/i.test(mealName);
  const isPost = /post[- ]?workout/i.test(mealName);
  const tags = isPre
    ? ['pre_workout', 'snack']
    : isPost
      ? ['post_workout', 'high_protein']
      : /breakfast/i.test(mealName)
        ? ['breakfast', 'high_protein']
        : /lunch|dinner/i.test(mealName)
          ? ['lunch', 'dinner', 'high_protein']
          : ['snack'];

  const pool = filterFoods(tags, restrictions, conditions);
  const pick = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] || filterFoods(['high_protein'], restrictions, conditions)[0];
  if (!pick) {
    const oats = findFoodEntry('oats')!;
    return [
      {
        item: oats.name,
        quantity: oats.serving,
        calories: oats.calories,
        protein: oats.protein,
        carbs: oats.carbs,
        fats: oats.fats,
        estimatedCost: oats.costInr,
        brand: pickBrand(oats.name, budget).name,
        recipe: expandRecipeIfShort(oats.name, oats.recipe, oats.serving),
        benefits: oats.benefits,
        source: 'market',
      },
    ];
  }

  const brand = pickBrand(pick.name, budget).name;
  const foods: FoodItem[] = [
    {
      item: pick.name,
      quantity: pick.serving,
      calories: pick.calories,
      protein: pick.protein,
      carbs: pick.carbs,
      fats: pick.fats,
      estimatedCost: pick.costInr,
      brand,
      recipe: expandRecipeIfShort(pick.name, pick.recipe, pick.serving),
      benefits: pick.benefits,
      source: 'market',
    },
  ];

  // Add a produce side for micros
  const sidePool = filterFoods(['snack'], restrictions, conditions).filter((f) =>
    /fruit|salad|carrot|spinach|orange|guava|curd/i.test(f.name)
  );
  if (sidePool.length) {
    const side = sidePool[Math.floor(Math.random() * sidePool.length)];
    foods.push({
      item: side.name,
      quantity: side.serving,
      calories: side.calories,
      protein: side.protein,
      carbs: side.carbs,
      fats: side.fats,
      estimatedCost: side.costInr,
      brand: pickBrand(side.name, budget).name,
      recipe: expandRecipeIfShort(side.name, side.recipe, side.serving),
      benefits: side.benefits,
      source: 'market',
    });
  }

  return foods;
}

async function geminiSwap(
  meal: any,
  preference: string,
  profile: UserDietProfile
): Promise<FoodItem[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const prompt = `You are a meal-swap assistant for an Indian fitness diet app.
Replace this meal with a DIFFERENT but similar-calorie option.

Current meal: ${meal.name} at ${meal.time}
Current foods: ${JSON.stringify(meal.foods?.map((f: any) => f.item))}
User preference: ${preference || 'variety / less boring'}
Goal: ${profile.goal}
Restrictions: ${(profile.dietaryRestrictions || []).join(', ') || 'none'}
Budget: ${profile.budget}

Return ONLY JSON:
{
  "foods": [
    {
      "item": "specific dish name",
      "quantity": "portion",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "estimatedCost": number,
      "brand": "India brand or Local mandi",
      "recipe": "Ingredients:\\n• ...\\n\\nMethod:\\n1. ...\\n2. ...\\n3. ...\\n4. ...\\n5. ...\\n6. ...",
      "benefits": "why this food helps"
    }
  ]
}
Keep total calories within ±15% of ${meal.totalCalories || 400}.
Name specific vegetables/fruits. Full recipes with 5+ steps.`;

    const model = getGeminiModel('gemini-2.5-flash');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.foods) || !parsed.foods.length) return null;
    return parsed.foods.map((f: any) => ({
      item: f.item,
      quantity: f.quantity || '1 serving',
      calories: Number(f.calories) || 0,
      protein: Number(f.protein) || 0,
      carbs: Number(f.carbs) || 0,
      fats: Number(f.fats) || 0,
      estimatedCost: Number(f.estimatedCost) || 40,
      brand: f.brand || 'Local',
      recipe: expandRecipeIfShort(f.item, f.recipe, f.quantity),
      benefits: f.benefits || '',
      source: 'market' as const,
    }));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const day = String(body.day || '').toLowerCase();
    const mealIndex = Number(body.mealIndex);
    const preference = String(body.preference || 'something different / more variety');

    if (!DAYS.includes(day as any) || Number.isNaN(mealIndex) || mealIndex < 0) {
      return NextResponse.json({ error: 'day and mealIndex required' }, { status: 400 });
    }

    await connectDB();
    const [user, dietDoc] = await Promise.all([
      User.findById(session.user.id).lean(),
      DietPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 }),
    ]);

    if (!dietDoc?.weeklyPlan?.[day]?.meals?.[mealIndex]) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const profile: UserDietProfile = {
      age: (user as any)?.age || 25,
      gender: (user as any)?.gender || 'male',
      height: (user as any)?.height || 170,
      weight: (user as any)?.weight || 70,
      activityLevel: (user as any)?.activityLevel || 'moderate',
      goal: (user as any)?.goal || 'maintenance',
      dietaryRestrictions: (user as any)?.dietaryRestrictions || [],
      medicalConditions: (user as any)?.medicalConditions || [],
      budget: (user as any)?.budget || 'middle',
      location: (user as any)?.location || { country: 'India', state: '', city: '' },
      livesInHostel: !!(user as any)?.additionalInfo?.livesInHostel,
      messMenuText: (user as any)?.additionalInfo?.messMenuText || '',
      gymTiming: (user as any)?.workoutPreferences?.gymTiming,
    };

    const meal = dietDoc.weeklyPlan[day].meals[mealIndex];
    let foods =
      (await geminiSwap(meal, preference, profile)) ||
      rulesSwap(meal.name, profile.dietaryRestrictions || [], profile.medicalConditions || [], profile.budget || 'middle');

    // Don't return the exact same primary item
    if (foods[0]?.item === meal.foods?.[0]?.item) {
      foods = rulesSwap(meal.name, profile.dietaryRestrictions || [], profile.medicalConditions || [], profile.budget || 'middle');
    }

    const totals = {
      totalCalories: Math.round(foods.reduce((s, f) => s + f.calories, 0)),
      totalProtein: Math.round(foods.reduce((s, f) => s + f.protein, 0)),
      totalCarbs: Math.round(foods.reduce((s, f) => s + f.carbs, 0)),
      totalFats: Math.round(foods.reduce((s, f) => s + f.fats, 0)),
      totalCost: Math.round(foods.reduce((s, f) => s + (f.estimatedCost || 0), 0)),
    };

    dietDoc.weeklyPlan[day].meals[mealIndex] = {
      ...meal.toObject?.() || meal,
      foods,
      ...totals,
    };

    // Recompute day totals
    const dayMeals = dietDoc.weeklyPlan[day].meals;
    dietDoc.weeklyPlan[day].dailyTotal = {
      calories: Math.round(dayMeals.reduce((s: number, m: any) => s + (m.totalCalories || 0), 0)),
      protein: Math.round(dayMeals.reduce((s: number, m: any) => s + (m.totalProtein || 0), 0)),
      carbs: Math.round(dayMeals.reduce((s: number, m: any) => s + (m.totalCarbs || 0), 0)),
      fats: Math.round(dayMeals.reduce((s: number, m: any) => s + (m.totalFats || 0), 0)),
      cost: Math.round(dayMeals.reduce((s: number, m: any) => s + (m.totalCost || 0), 0)),
    };

    const planObj = dietDoc.toObject() as DietPlanData;
    const cleaned = sanitizePlanBranding(planObj, profile);
    const withGrocery = withGroceryList(cleaned, {
      budget: profile.budget,
      livesInHostel: profile.livesInHostel,
    });

    dietDoc.weeklyPlan = withGrocery.weeklyPlan as any;
    dietDoc.markModified('weeklyPlan');
    dietDoc.set('groceryList', withGrocery.groceryList);
    await dietDoc.save();

    return NextResponse.json({
      message: 'Meal swapped',
      day,
      mealIndex,
      meal: dietDoc.weeklyPlan[day].meals[mealIndex],
      dietPlan: {
        ...withGrocery,
        _id: dietDoc._id,
        userId: dietDoc.userId,
      },
    });
  } catch (error: any) {
    console.error('Swap meal error:', error);
    return NextResponse.json(
      { error: 'Failed to swap meal', details: error.message },
      { status: 500 }
    );
  }
}
