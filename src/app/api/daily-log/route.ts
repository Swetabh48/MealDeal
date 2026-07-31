import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DailyLog from '@/models/DailyLog';
import { toDateKey, shiftDateKey } from '@/lib/meal-checkin';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get('dateKey') || toDateKey();
    const range = searchParams.get('range'); // e.g. 7

    await connectDB();

    if (range) {
      const days = Math.min(30, Math.max(1, parseInt(range, 10) || 7));
      const from = shiftDateKey(dateKey, -(days - 1));
      const logs = await DailyLog.find({
        userId: session.user.id,
        dateKey: { $gte: from, $lte: dateKey },
      })
        .sort({ dateKey: 1 })
        .lean();
      return NextResponse.json({ logs, from, to: dateKey });
    }

    const log = await DailyLog.findOne({ userId: session.user.id, dateKey }).lean();
    return NextResponse.json({
      log: log || { dateKey, waterGlasses: 0, sleepHours: undefined, sleepQuality: undefined },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const dateKey = body.dateKey || toDateKey();
    const update: Record<string, unknown> = {};
    if (typeof body.waterGlasses === 'number') update.waterGlasses = Math.max(0, Math.min(20, body.waterGlasses));
    if (typeof body.sleepHours === 'number') update.sleepHours = body.sleepHours;
    if (body.sleepQuality) update.sleepQuality = body.sleepQuality;
    if (typeof body.notes === 'string') update.notes = body.notes;

    await connectDB();
    const log = await DailyLog.findOneAndUpdate(
      { userId: session.user.id, dateKey },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ log, message: 'Saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
