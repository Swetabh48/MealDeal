import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import { expandRecipeIfShort } from '@/lib/diet/expand-recipe';
import { withGroceryList } from '@/lib/diet/grocery-list';
import { sanitizePlanBranding } from '@/lib/diet/validator';
import type { DietPlanData, UserDietProfile } from '@/lib/diet/types';
import User from '@/models/User';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function findMealIndex(meals: any[], slot: MealSlot): number {
  const patterns: Record<MealSlot, RegExp> = {
    breakfast: /breakfast|morning/i,
    lunch: /lunch|afternoon/i,
    dinner: /dinner|supper|evening/i,
    snack: /snack/i,
  };
  const re = patterns[slot];
  // Prefer primary meal names — skip pre/post workout when looking for snack unless that's all we have
  let idx = meals.findIndex((m) => {
    const name = m.name || '';
    if (slot === 'snack' && /pre|post|workout/i.test(name)) return false;
    return re.test(name);
  });
  if (idx < 0 && slot === 'snack') {
    idx = meals.findIndex((m) => /snack|pre.?workout|post.?workout/i.test(m.name || ''));
  }
  return idx;
}

function defaultTimeForSlot(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return '8:00 AM';
    case 'lunch':
      return '1:00 PM';
    case 'dinner':
      return '8:00 PM';
    default:
      return '4:00 PM';
  }
}

function slotLabel(slot: MealSlot): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/** Replace (or insert) a recipe into today's breakfast / lunch / dinner / snack */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      calories = 300,
      protein = 15,
      carbs = 30,
      fats = 10,
      ingredients = [],
      steps = [],
      slot = 'lunch',
    } = body;

    const mealSlot = String(slot).toLowerCase() as MealSlot;
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealSlot)) {
      return NextResponse.json(
        { error: 'slot must be breakfast, lunch, dinner, or snack' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const todayIdx = new Date().getDay();
    const day = WEEKDAY_KEYS[todayIdx];

    await connectDB();
    const [user, dietDoc] = await Promise.all([
      User.findById(session.user.id).lean(),
      DietPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 }),
    ]);

    if (!dietDoc?.weeklyPlan?.[day]) {
      return NextResponse.json({ error: 'No meal plan for today' }, { status: 404 });
    }

    const recipeText = [
      'Ingredients:',
      ...(ingredients.length ? ingredients.map((i: string) => `• ${i}`) : ['• As listed in recipe hub']),
      '',
      'Method:',
      ...(steps.length
        ? steps.map((s: string, i: number) => `${i + 1}. ${s}`)
        : ['1. Follow the recipe steps from the Recipes hub.']),
    ].join('\n');

    const food = {
      item: title,
      quantity: '1 serving',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      estimatedCost: 60,
      brand: 'Recipe hub',
      recipe: expandRecipeIfShort(title, recipeText, '1 serving'),
      benefits: `Replaced ${slotLabel(mealSlot)} from Recipes hub.`,
      source: 'market',
    };

    const meals = [...(dietDoc.weeklyPlan[day].meals || [])];
    const idx = findMealIndex(meals, mealSlot);
    const mealName = slotLabel(mealSlot);

    if (idx >= 0) {
      const existing = meals[idx];
      meals[idx] = {
        ...existing,
        name: existing.name || mealName,
        time: existing.time || defaultTimeForSlot(mealSlot),
        foods: [food],
        totalCalories: food.calories,
        totalProtein: food.protein,
        totalCarbs: food.carbs,
        totalFats: food.fats,
        totalCost: food.estimatedCost,
      };
    } else {
      meals.push({
        name: mealName,
        time: defaultTimeForSlot(mealSlot),
        foods: [food],
        totalCalories: food.calories,
        totalProtein: food.protein,
        totalCarbs: food.carbs,
        totalFats: food.fats,
        totalCost: food.estimatedCost,
      });
    }

    dietDoc.weeklyPlan[day].meals = meals;
    dietDoc.weeklyPlan[day].dailyTotal = {
      calories: Math.round(meals.reduce((s: number, m: any) => s + (m.totalCalories || 0), 0)),
      protein: Math.round(meals.reduce((s: number, m: any) => s + (m.totalProtein || 0), 0)),
      carbs: Math.round(meals.reduce((s: number, m: any) => s + (m.totalCarbs || 0), 0)),
      fats: Math.round(meals.reduce((s: number, m: any) => s + (m.totalFats || 0), 0)),
      cost: Math.round(meals.reduce((s: number, m: any) => s + (m.totalCost || 0), 0)),
    };

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
      messMenuText: '',
      gymTiming: (user as any)?.workoutPreferences?.gymTiming,
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
      message: `"${title}" replaced today's ${mealName}`,
      day,
      slot: mealSlot,
      dietPlan: { ...withGrocery, _id: dietDoc._id, userId: dietDoc.userId },
    });
  } catch (error: any) {
    console.error('Add recipe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
