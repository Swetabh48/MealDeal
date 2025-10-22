// src/app/api/diet/auto-regenerate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DietPlan from '@/models/DietPlan';
import { generateDietPlan } from '@/lib/diet-generator';

// This endpoint can be called by a cron job or manually
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Auto-regenerating diet plan for user:', session.user.id);

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check when was the last plan generated
    const lastPlan = await DietPlan.findOne({ userId: user._id })
      .sort({ generatedAt: -1 });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Only regenerate if last plan is older than 7 days
    if (lastPlan && new Date(lastPlan.generatedAt) > oneWeekAgo) {
      return NextResponse.json({ 
        message: 'Plan was recently generated',
        lastGenerated: lastPlan.generatedAt
      });
    }

    console.log('✅ Generating new weekly plan...');

    // Get additional context from request body if provided
    const body = await req.json().catch(() => ({}));

    // Generate new diet plan
    const dietData = await generateDietPlan({
      age: user.age!,
      gender: user.gender || 'male',
      height: user.height!,
      weight: user.weight!,
      activityLevel: user.activityLevel || 'sedentary',
      goal: user.goal!,
      dietaryRestrictions: user.dietaryRestrictions || [],
      medicalConditions: user.medicalConditions || [],
      budget: user.budget || 'middle',
      location: user.location || { country: 'India', state: '', city: '' },
      additionalInfo: user.additionalInfo || {}
    });

    console.log('✅ New diet plan generated');

    // Save new diet plan
    const dietPlan = await DietPlan.create({
      userId: user._id,
      ...dietData,
      generatedAt: new Date(),
    });

    console.log('✅ New diet plan saved with ID:', dietPlan._id);

    return NextResponse.json({ 
      dietPlan,
      message: 'New weekly plan generated successfully',
      generatedAt: dietPlan.generatedAt
    });
  } catch (error: any) {
    console.error('❌ Auto-regeneration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to auto-regenerate diet plan',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if regeneration is needed
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const lastPlan = await DietPlan.findOne({ userId: session.user.id })
      .sort({ generatedAt: -1 });

    if (!lastPlan) {
      return NextResponse.json({ 
        needsRegeneration: true,
        reason: 'No plan exists'
      });
    }

    const now = new Date();
    const planAge = now.getTime() - new Date(lastPlan.generatedAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const needsRegeneration = planAge > sevenDays;

    return NextResponse.json({ 
      needsRegeneration,
      lastGenerated: lastPlan.generatedAt,
      daysOld: Math.floor(planAge / (24 * 60 * 60 * 1000)),
      reason: needsRegeneration ? 'Plan is older than 7 days' : 'Plan is current'
    });
  } catch (error: any) {
    console.error('❌ Check regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to check regeneration status' },
      { status: 500 }
    );
  }
}