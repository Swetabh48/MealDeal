import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { WorkoutPlan } from '@/models/WorkoutPlan';
import { generateWorkoutPlan } from '@/lib/workout-generator';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Checking session...');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session valid for user:', session.user.id);

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate user has completed basic profile
    if (!user.age || !user.height || !user.weight || !user.goal) {
      return NextResponse.json(
        { error: 'Please complete your basic profile first' },
        { status: 400 }
      );
    }

    // Get workout preferences from request body
    const body = await req.json().catch(() => ({}));
    const { 
      gymTiming, 
      workoutDays, 
      preferredType, 
      availableEquipment, 
      experience,
      focusAreas 
    } = body;

    console.log('🏋️ Generating AI workout plan...');
    console.log('Gym timing:', gymTiming);
    console.log('Medical conditions:', user.medicalConditions);

    // Generate workout plan using AI
    const workoutData = await generateWorkoutPlan({
      age: user.age,
      gender: user.gender || 'male',
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel || 'sedentary',
      goal: user.goal,
      medicalConditions: user.medicalConditions || [],
      gymTiming: gymTiming || user.workoutPreferences?.gymTiming,
      workoutPreference: preferredType || user.workoutPreferences?.preferredType || 'both',
      availableEquipment: availableEquipment || user.workoutPreferences?.availableEquipment || [],
      experience: experience || user.workoutPreferences?.experience || 'beginner'
    });

    console.log('✅ Workout plan generated successfully');

    // Save workout plan to database
    const workoutPlan = await WorkoutPlan.create({
      userId: user._id,
      ...workoutData,
      gymTiming: gymTiming || user.workoutPreferences?.gymTiming,
      generatedAt: new Date()
    });

    console.log('✅ Workout plan saved with ID:', workoutPlan._id);

    // Update user workout preferences
    await User.findByIdAndUpdate(user._id, {
      workoutPreferences: {
        gymTiming: gymTiming || user.workoutPreferences?.gymTiming,
        workoutDays: workoutDays || user.workoutPreferences?.workoutDays || 5,
        preferredType: preferredType || user.workoutPreferences?.preferredType || 'both',
        availableEquipment: availableEquipment || user.workoutPreferences?.availableEquipment || [],
        experience: experience || user.workoutPreferences?.experience || 'beginner',
        focusAreas: focusAreas || user.workoutPreferences?.focusAreas || []
      },
      workoutPlanGenerated: true
    });

    return NextResponse.json({
      workoutPlan,
      message: 'Workout plan generated successfully'
    });

  } catch (error: any) {
    console.error('❌ Workout plan generation error:', error);

    const errorMessage = error.message || 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to generate workout plan',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}