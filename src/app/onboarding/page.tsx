'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import OnboardingFlow from '@/components/onboarding-flow';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleComplete = async (formData: any) => {
    setLoading(true);
    
    try {
      // Update user profile with all the data
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          activityLevel: formData.activityLevel,
          goal: formData.goal,
          dietaryRestrictions: formData.dietaryRestrictions,
          medicalConditions: formData.medicalConditions,
          budget: formData.budget,
          location: formData.location,
          // Store additional context for AI
          additionalInfo: {
            goalDescription: formData.goalDescription,
            challenges: formData.challenges,
            expectations: formData.expectations,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully!');

      // Generate initial diet plan
      const dietResponse = await fetch('/api/diet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalDescription: formData.goalDescription,
          challenges: formData.challenges,
          expectations: formData.expectations,
        }),
      });

      if (!dietResponse.ok) {
        throw new Error('Failed to generate diet plan');
      }

      toast.success('Your personalized nutrition plan is ready! 🎉');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Personalized Plan...</h2>
          <p className="text-gray-600">Our AI is analyzing your profile and generating the perfect nutrition plan for you</p>
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <p>✓ Analyzing your health goals</p>
            <p>✓ Finding locally available ingredients</p>
            <p>✓ Calculating nutritional requirements</p>
            <p>✓ Creating your meal plans</p>
          </div>
        </div>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}