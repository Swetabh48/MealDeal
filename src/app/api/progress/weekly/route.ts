import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MealCheckIn from '@/models/MealCheckIn';
import DailyLog from '@/models/DailyLog';
import Progress from '@/models/Progress';
import DietPlan from '@/models/DietPlan';
import { toDateKey, shiftDateKey, computeDayAdherence } from '@/lib/meal-checkin';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Weekly chart payload: adherence, calories logged, water, sleep, weight */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = toDateKey();
    const from = shiftDateKey(today, -6);
    const userId = session.user.id;

    await connectDB();

    const [checkIns, dailyLogs, weights, plan] = await Promise.all([
      MealCheckIn.find({ userId, dateKey: { $gte: from, $lte: today } }).lean(),
      DailyLog.find({ userId, dateKey: { $gte: from, $lte: today } }).lean(),
      Progress.find({
        userId,
        date: {
          $gte: new Date(from + 'T00:00:00'),
          $lte: new Date(today + 'T23:59:59'),
        },
      })
        .sort({ date: 1 })
        .lean(),
      DietPlan.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const days: any[] = [];
    for (let i = 0; i < 7; i++) {
      const key = shiftDateKey(from, i);
      const [y, m, d] = key.split('-').map(Number);
      const weekday = WEEKDAY_KEYS[new Date(y, m - 1, d).getDay()];
      const planned = plan?.weeklyPlan?.[weekday]?.meals?.length || 0;
      const dayChecks = checkIns.filter((c) => c.dateKey === key);
      const adh = computeDayAdherence(planned, dayChecks.length);
      const log = dailyLogs.find((l) => l.dateKey === key);
      const cal = dayChecks.reduce((s, c) => s + (c.calories || 0), 0);
      const weightEntry = weights.find((w) => {
        const wk = toDateKey(new Date(w.date));
        return wk === key;
      });

      days.push({
        dateKey: key,
        label: new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        plannedMeals: planned,
        checkedIn: dayChecks.length,
        adherencePercent: adh.percent,
        qualifies: adh.qualifies,
        caloriesLogged: cal,
        waterGlasses: log?.waterGlasses || 0,
        sleepHours: log?.sleepHours ?? null,
        sleepQuality: log?.sleepQuality ?? null,
        weight: weightEntry?.weight ?? null,
      });
    }

    const avgAdherence = Math.round(
      days.reduce((s, d) => s + d.adherencePercent, 0) / Math.max(days.length, 1)
    );
    const avgWater = Math.round(
      (days.reduce((s, d) => s + d.waterGlasses, 0) / Math.max(days.length, 1)) * 10
    ) / 10;
    const sleepDays = days.filter((d) => d.sleepHours != null);
    const avgSleep =
      sleepDays.length > 0
        ? Math.round(
            (sleepDays.reduce((s, d) => s + d.sleepHours, 0) / sleepDays.length) * 10
          ) / 10
        : null;

    return NextResponse.json({
      from,
      to: today,
      days: days.map((d) => ({
        ...d,
        mealsEaten: d.checkedIn,
        sleepHours: d.sleepHours ?? 0,
      })),
      summary: {
        avgAdherence,
        adherencePct: avgAdherence,
        avgWater,
        avgWaterGlasses: avgWater,
        avgSleep,
        avgSleepHours: avgSleep ?? 0,
        qualifyingDays: days.filter((d) => d.qualifies).length,
        mealsEaten: days.reduce((s, d) => s + d.checkedIn, 0),
        mealsPlanned: days.reduce((s, d) => s + d.plannedMeals, 0),
        avgCalories: Math.round(
          days.reduce((s, d) => s + d.caloriesLogged, 0) / Math.max(days.length, 1)
        ),
      },
    });
  } catch (error: any) {
    console.error('Weekly progress error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
