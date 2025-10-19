import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DietPlan from '@/models/DietPlan';
import { generateDietPlan } from '@/lib/diet-generator';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate user has completed profile
    if (!user.age || !user.height || !user.weight || !user.goal) {
      return NextResponse.json(
        { error: 'Please complete your profile first' },
        { status: 400 }
      );
    }

    // Generate diet plan using AI
    const dietData = await generateDietPlan({
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goal: user.goal,
      dietaryRestrictions: user.dietaryRestrictions,
      medicalConditions: user.medicalConditions,
      budget: user.budget,
      location: user.location,
    });

    // Save diet plan to database
    const dietPlan = await DietPlan.create({
      userId: user._id,
      ...dietData,
    });

    return NextResponse.json({ dietPlan });
  } catch (error) {
    console.error('Diet plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diet plan' },
      { status: 500 }
    );
  }
}