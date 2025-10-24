import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { WorkoutLog } from '@/models/WorkoutPlan';

// POST - Log workout completion
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      workoutPlanId,
      date,
      day,
      exercises,
      totalDuration,
      caloriesBurned,
      difficulty,
      notes
    } = body;

    await connectDB();

    // Create workout log
    const workoutLog = await WorkoutLog.create({
      userId: session.user.id,
      workoutPlanId,
      date: new Date(date),
      day,
      exercises,
      totalDuration,
      caloriesBurned,
      difficulty,
      notes
    });

    return NextResponse.json({
      workoutLog,
      message: 'Workout logged successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error logging workout:', error);
    return NextResponse.json(
      { error: 'Failed to log workout', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve workout logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workoutLogs = await WorkoutLog.find({
      userId: session.user.id,
      date: { $gte: thirtyDaysAgo }
    })
    .sort({ date: -1 })
    .populate('workoutPlanId');

    return NextResponse.json({ workoutLogs });

  } catch (error) {
    console.error('Error fetching workout logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    );
  }
}