'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OnboardingFlow from '@/components/onboarding-flow';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleComplete = async (formData: any) => {
    try {
      // Update user profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      // Generate diet plan
      const dietResponse = await fetch('/api/diet/generate', {
        method: 'POST',
      });

      if (!dietResponse.ok) throw new Error('Failed to generate diet plan');

      toast.success('Your personalized plan has been created');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
