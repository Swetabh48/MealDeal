import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DietPlan from '@/models/DietPlan';
import { generateDietPlan } from '@/lib/diet-generator';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Checking session...');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session valid for user:', session.user.id);

    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    console.log('👤 Fetching user profile...');
    const user = await User.findById(session.user.id);

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', user.email);

    // Validate user has completed profile
    if (!user.age || !user.height || !user.weight || !user.goal) {
      console.log('❌ Incomplete profile:', {
        hasAge: !!user.age,
        hasHeight: !!user.height,
        hasWeight: !!user.weight,
        hasGoal: !!user.goal
      });
      return NextResponse.json(
        { error: 'Please complete your profile first. Missing: age, height, weight, or goal.' },
        { status: 400 }
      );
    }

    // Get additional context from request body
    const body = await req.json().catch(() => ({}));
    const { goalDescription, challenges, expectations, livesInHostel, messMenuText, gymTiming } = body;

    const resolvedHostel = Boolean(
      livesInHostel ?? user.additionalInfo?.livesInHostel ?? false
    );
    const resolvedMess = resolvedHostel
      ? messMenuText || user.additionalInfo?.messMenuText || ''
      : '';

    console.log('🤖 Generating dual-pipeline diet plan...');
    if (resolvedHostel) {
      console.log('🏠 Generating hostel-friendly plan...');
      if (resolvedMess) console.log('📋 Using mess menu text');
    } else {
      console.log('🏡 Non-hostel plan — mess branding disabled');
    }

    const resolvedGymTiming =
      gymTiming || user.workoutPreferences?.gymTiming || undefined;

    if (resolvedGymTiming) {
      console.log('🏋️ Gym timing:', resolvedGymTiming);
    }
    
    // Generate diet plan using dual pipeline (Gemini + rules + validator + recipes)
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
      },
      livesInHostel: resolvedHostel,
      messMenuText: resolvedMess,
      gymTiming: resolvedGymTiming,
    });

    console.log('✅ Diet plan generated successfully', {
      winner: dietData.generationMeta?.sources?.winner,
      score: dietData.generationMeta?.finalScore,
    });

    console.log('💾 Saving diet plan to database...');
    // Save diet plan to database
    const dietPlan = await DietPlan.create({
      userId: user._id,
      ...dietData,
      generatedAt: new Date(),
    });

    console.log('✅ Diet plan saved with ID:', dietPlan._id);

    // Mark onboarding as completed
    if (!user.onboardingCompleted) {
      console.log('🎯 Marking onboarding as completed...');
      await User.findByIdAndUpdate(user._id, { onboardingCompleted: true });
      console.log('✅ Onboarding completed');
    }

    return NextResponse.json({ 
      dietPlan,
      message: 'Diet plan generated successfully'
    });
  } catch (error: any) {
    console.error('❌ Diet plan generation error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = {
      message: errorMessage,
      type: error.name || 'Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };

    return NextResponse.json(
      { 
        error: 'Failed to generate diet plan',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { debug: errorDetails })
      },
      { status: 500 }
    );
  }
}