import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MealCheckIn from '@/models/MealCheckIn';
import DietPlan from '@/models/DietPlan';
import {
  toDateKey,
  shiftDateKey,
  computeStreak,
} from '@/lib/meal-checkin';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

function weekdayFromDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return WEEKDAY_KEYS[dt.getDay()];
}

function plannedCountForDay(plan: any, dateKey: string): number {
  if (!plan?.weeklyPlan) return 0;
  const day = weekdayFromDateKey(dateKey);
  return plan.weeklyPlan[day]?.meals?.length || 0;
}

// POST — check in a planned meal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      mealName,
      mealTime,
      calories = 0,
      protein = 0,
      carbs = 0,
      fats = 0,
      portionNote,
      dateKey: bodyDateKey,
    } = body;

    if (!mealName || typeof mealName !== 'string') {
      return NextResponse.json({ error: 'mealName is required' }, { status: 400 });
    }

    const dateKey = bodyDateKey || toDateKey();
    await connectDB();

    const checkIn = await MealCheckIn.findOneAndUpdate(
      {
        userId: session.user.id,
        dateKey,
        mealName: mealName.trim(),
      },
      {
        $set: {
          mealTime,
          calories: Math.round(Number(calories) || 0),
          protein: Math.round((Number(protein) || 0) * 10) / 10,
          carbs: Math.round((Number(carbs) || 0) * 10) / 10,
          fats: Math.round((Number(fats) || 0) * 10) / 10,
          portionNote,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const stats = await buildStats(session.user.id, dateKey);

    return NextResponse.json({
      checkIn,
      ...stats,
      message: 'Meal checked in',
    });
  } catch (error: any) {
    console.error('Meal check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in meal', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE — undo a check-in
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mealName = searchParams.get('mealName');
    const dateKey = searchParams.get('dateKey') || toDateKey();

    if (!mealName) {
      return NextResponse.json({ error: 'mealName is required' }, { status: 400 });
    }

    await connectDB();
    await MealCheckIn.deleteOne({
      userId: session.user.id,
      dateKey,
      mealName,
    });

    const stats = await buildStats(session.user.id, dateKey);
    return NextResponse.json({ message: 'Check-in removed', ...stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to undo check-in', details: error.message },
      { status: 500 }
    );
  }
}

// GET — today's check-ins + streak
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get('dateKey') || toDateKey();

    await connectDB();
    const stats = await buildStats(session.user.id, dateKey);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load check-ins', details: error.message },
      { status: 500 }
    );
  }
}

async function buildStats(userId: string, dateKey: string) {
  const plan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 }).lean();

  const fromKey = shiftDateKey(dateKey, -60);
  const checkIns = await MealCheckIn.find({
    userId,
    dateKey: { $gte: fromKey, $lte: dateKey },
  })
    .sort({ createdAt: 1 })
    .lean();

  const byDay = new Map<string, typeof checkIns>();
  for (const c of checkIns) {
    const list = byDay.get(c.dateKey) || [];
    list.push(c);
    byDay.set(c.dateKey, list);
  }

  const dayMap = new Map<string, { planned: number; checkedIn: number }>();
  // Seed today + any day with check-ins
  const keys = new Set<string>([dateKey, ...byDay.keys()]);
  for (const k of keys) {
    dayMap.set(k, {
      planned: plannedCountForDay(plan, k),
      checkedIn: byDay.get(k)?.length || 0,
    });
  }

  const { currentStreak, bestStreak, today } = computeStreak(dateKey, dayMap);
  const todayCheckIns = byDay.get(dateKey) || [];

  return {
    dateKey,
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
  };
}
