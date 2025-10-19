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
  const [errorDetails, setErrorDetails] = useState<string>('');

  const handleComplete = async (formData: any) => {
    setLoading(true);
    setErrorDetails('');
    
    try {
      console.log('📝 Updating user profile...');
      
      // Update user profile with all the data
      const profileResponse = await fetch('/api/user/profile', {
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

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      console.log('✅ Profile updated successfully');
      toast.success('Profile updated successfully!');

      console.log('🤖 Generating diet plan...');
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
        const errorData = await dietResponse.json();
        console.error('❌ Diet generation error:', errorData);
        
        const errorMsg = errorData.details || errorData.error || 'Failed to generate diet plan';
        setErrorDetails(errorMsg);
        
        // Check for specific error types - FIXED: Changed OpenAI to Gemini
        if (errorMsg.includes('API key') || errorMsg.includes('GEMINI_API_KEY')) {
          throw new Error('Gemini API key is missing or invalid. Please add a valid GEMINI_API_KEY to your .env.local file. Get a free key from https://aistudio.google.com/app/apikey');
        } else if (errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('Gemini API quota exceeded. Please wait a moment and try again.');
        } else if (errorMsg.includes('MongoDB') || errorMsg.includes('database')) {
          throw new Error('Database connection error. Please check your MongoDB connection.');
        } else if (errorMsg.includes('model') || errorMsg.includes('not found')) {
          throw new Error('Gemini model not available. Please verify your API key has access to Gemini models.');
        } else {
          throw new Error(errorMsg);
        }
      }

      console.log('✅ Diet plan generated successfully');
      toast.success('Your personalized nutrition plan is ready! 🎉');
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      console.error('❌ Onboarding error:', error);
      const errorMessage = error.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      setErrorDetails(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Personalized Plan...</h2>
          <p className="text-gray-600 mb-4">Our AI is analyzing your profile and generating the perfect nutrition plan for you</p>
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <p>✓ Analyzing your health goals</p>
            <p>✓ Finding locally available ingredients</p>
            <p>✓ Calculating nutritional requirements</p>
            <p>✓ Creating your meal plans</p>
          </div>
          
          {errorDetails && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm text-red-800 font-medium mb-1">Error Details:</p>
              <p className="text-xs text-red-600">{errorDetails}</p>
              <div className="mt-3 text-xs text-red-700">
                <p className="font-medium">Need help?</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Get a free Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                  <li>Add it to your .env.local file as: GEMINI_API_KEY=your_key_here</li>
                  <li>Restart your development server</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}