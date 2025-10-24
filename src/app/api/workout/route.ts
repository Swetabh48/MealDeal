import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { WorkoutPlan } from '@/models/WorkoutPlan';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get the most recent workout plan
    const workoutPlan = await WorkoutPlan.findOne({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ workoutPlan });

  } catch (error) {
    console.error('Workout plan fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}