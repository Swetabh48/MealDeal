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

    // Get additional context from request body if provided
    const body = await req.json().catch(() => ({}));
    const { goalDescription, challenges, expectations } = body;

    // Generate diet plan using AI with comprehensive user data
    const dietData = await generateDietPlan({
      age: user.age,
      gender: user.gender || 'male',
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel || 'sedentary',
      goal: user.goal,
      dietaryRestrictions: user.dietaryRestrictions || [],
      medicalConditions: user.medicalConditions || [],
      budget: user.budget || 'middle',
      location: user.location || { country: 'India', state: '', city: '' },
      additionalInfo: {
        goalDescription: goalDescription || user.additionalInfo?.goalDescription || '',
        challenges: challenges || user.additionalInfo?.challenges || '',
        expectations: expectations || user.additionalInfo?.expectations || '',
      }
    });

    // Save diet plan to database
    const dietPlan = await DietPlan.create({
      userId: user._id,
      ...dietData,
      generatedAt: new Date(),
    });

    // Mark onboarding as completed
    if (!user.onboardingCompleted) {
      await User.findByIdAndUpdate(user._id, { onboardingCompleted: true });
    }

    return NextResponse.json({ 
      dietPlan,
      message: 'Diet plan generated successfully'
    });
  } catch (error: any) {
    console.error('Diet plan generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate diet plan',
        details: error.message 
      },
      { status: 500 }
    );
  }
}