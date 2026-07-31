import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import User from '@/models/User';
import CustomMeal from '@/models/CustomMeal';
import MealCheckIn from '@/models/MealCheckIn';
import { sanitizePlanBranding } from '@/lib/diet/validator';
import { withGroceryList } from '@/lib/diet/grocery-list';
import { toDateKey, shiftDateKey, computeStreak } from '@/lib/meal-checkin';
import type { DietPlanData, UserDietProfile } from '@/lib/diet/types';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** One round-trip for dashboard: profile + diet + check-ins + today's custom meals */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const dateKey = toDateKey();
    await connectDB();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const fromKey = shiftDateKey(dateKey, -60);

    const [user, dietPlanDoc, checkIns, customMeals] = await Promise.all([
      User.findById(userId)
        .select(
          'name age gender height weight activityLevel goal dietaryRestrictions medicalConditions budget location additionalInfo workoutPreferences onboardingCompleted'
        )
        .lean(),
      DietPlan.findOne({ userId }).sort({ createdAt: -1 }).lean(),
      MealCheckIn.find({ userId, dateKey: { $gte: fromKey, $lte: dateKey } })
        .sort({ createdAt: 1 })
        .lean(),
      CustomMeal.find({
        userId,
        date: { $gte: startOfToday, $lte: endOfToday },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    let dietPlan: any = null;
    if (dietPlanDoc) {
      const planObj = { ...dietPlanDoc } as DietPlanData & {
        groceryList?: any;
        _id?: any;
        userId?: any;
      };
      const livesInHostel = !!(user as any)?.additionalInfo?.livesInHostel;
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
        livesInHostel,
        messMenuText: (user as any)?.additionalInfo?.messMenuText || '',
        gymTiming: (user as any)?.workoutPreferences?.gymTiming,
      };
      const cleaned = sanitizePlanBranding(planObj, profile);
      dietPlan = withGroceryList(cleaned, {
        budget: profile.budget,
        livesInHostel,
      });
      dietPlan = { ...dietPlan, _id: dietPlanDoc._id, userId: dietPlanDoc.userId };
    }

    const byDay = new Map<string, typeof checkIns>();
    for (const c of checkIns) {
      const list = byDay.get(c.dateKey) || [];
      list.push(c);
      byDay.set(c.dateKey, list);
    }

    const dayMap = new Map<string, { planned: number; checkedIn: number }>();
    const keys = new Set<string>([dateKey, ...byDay.keys()]);
    for (const k of keys) {
      const [y, m, d] = k.split('-').map(Number);
      const weekday = WEEKDAY_KEYS[new Date(y, m - 1, d).getDay()];
      const planned = dietPlan?.weeklyPlan?.[weekday]?.meals?.length || 0;
      dayMap.set(k, { planned, checkedIn: byDay.get(k)?.length || 0 });
    }

    const { currentStreak, bestStreak, today } = computeStreak(dateKey, dayMap);
    const todayCheckIns = byDay.get(dateKey) || [];

    return NextResponse.json({
      user,
      dietPlan,
      checkIns: todayCheckIns.map((c) => ({
        mealName: c.mealName,
        mealTime: c.mealTime,
        calories: c.calories,
        protein: c.protein,
        carbs: c.carbs,
        fats: c.fats,
        createdAt: c.createdAt,
      })),
      loggedMealNames: todayCheckIns.map((c) => c.mealName),
      adherence: today,
      currentStreak,
      bestStreak,
      customMeals,
      dateKey,
    });
  } catch (error: any) {
    console.error('Dashboard bootstrap error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard', details: error.message },
      { status: 500 }
    );
  }
}
