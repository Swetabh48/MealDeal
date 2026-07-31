import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mailConfigured, sendAppEmail } from '@/lib/mail';

/** Sunday night: email nudge to regenerate next week's plan */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only meaningful on Sunday (server local / UTC — client also gates)
    const day = new Date().getDay();
    if (day !== 0) {
      return NextResponse.json({ skipped: true, reason: 'Not Sunday' });
    }

    if (!mailConfigured()) {
      return NextResponse.json({
        skipped: true,
        reason: 'Email SMTP not configured — browser push still works',
      });
    }

    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const result = await sendAppEmail({
      to: session.user.email,
      subject: 'MealDeal · Ready for next week?',
      text: [
        'Hey — it’s Sunday night.',
        'Regenerate your meal plan so grocery + meals are ready for the week ahead.',
        '',
        `Open MealDeal: ${base}/meal-plan`,
      ].join('\n'),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Sunday email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
