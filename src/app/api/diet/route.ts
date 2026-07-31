import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import User from '@/models/User';
import { sanitizePlanBranding } from '@/lib/diet/validator';
import { withGroceryList } from '@/lib/diet/grocery-list';
import type { DietPlanData, UserDietProfile } from '@/lib/diet/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const [dietPlanDoc, user] = await Promise.all([
      DietPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
      User.findById(session.user.id).select('age gender height weight activityLevel goal dietaryRestrictions medicalConditions budget location additionalInfo workoutPreferences').lean(),
    ]);

    if (!dietPlanDoc) {
      return NextResponse.json({ dietPlan: null });
    }

    const planObj = { ...dietPlanDoc } as DietPlanData & { _id?: any; userId?: any; groceryList?: any };
    const livesInHostel = !!(user as any)?.additionalInfo?.livesInHostel;

    const profile: UserDietProfile = {
      age: (user as any)?.age || 25,
      gender: (user as any)?.gender || 'male',
      height: (user as any)?.height || 170,
      weight: (user as any)?.weight || 70,
      activityLevel: (user as any)?.activityLevel || 'moderate',
      goal: (user as any)?.goal || 'maintenance',
      dietaryRestrictions: (user as any)?.dietaryRestrictions || [],
      medicalConditions: (user as any)?.medicalConditions || [],
      budget: (user as any)?.budget || 'middle',
      location: (user as any)?.location || { country: 'India', state: '', city: '' },
      livesInHostel,
      messMenuText: (user as any)?.additionalInfo?.messMenuText || '',
      gymTiming: (user as any)?.workoutPreferences?.gymTiming,
    };

    // Always rebuild grocery so list format stays current (named produce, spend math)
    const withGrocery = withGroceryList(cleaned, {
      budget: profile.budget,
      livesInHostel,
    });

    return NextResponse.json({
      dietPlan: {
        ...withGrocery,
        _id: dietPlanDoc._id,
        userId: dietPlanDoc.userId,
      },
    });
  } catch (error) {
    console.error('Diet plan fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
