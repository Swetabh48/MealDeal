import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getDoctorResponse } from '@/lib/doctor-chat';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = await getDoctorResponse(messages, {
      age: user.age || 60,
      weight: user.weight || 56,
      height: user.height || 173,
      medicalConditions: user.medicalConditions || [],
      currentGoal: user.goal || 'weight_gain',
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Doctor chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}