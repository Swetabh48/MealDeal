'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import OnboardingFlow from '@/components/onboarding-flow';
import { toast } from 'sonner';

// Function to extract text from image using Gemini Vision
async function extractTextFromImage(file: File): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    
    const response = await fetch('/api/extract-menu-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mimeType: file.type }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract text from image');
    }

    const data = await response.json();
    
    if (!data.text || data.text.trim().length < 20) {
      throw new Error('Insufficient text extracted from image');
    }
    
    return data.text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleComplete = async (formData: any) => {
    setLoading(true);
    setErrorDetails('');
    
    try {
      console.log('📝 Starting onboarding process...');
      
      // Extract mess menu text if provided
      let messMenuText = '';
      let livesInHostel = formData.livesInHostel;
      
      if (formData.livesInHostel && formData.messMenu) {
        try {
          setCurrentStep('Reading mess menu');
          toast.loading('Reading mess menu...', { id: 'mess-menu' });
          messMenuText = await extractTextFromImage(formData.messMenu);
          toast.success('Mess menu processed!', { id: 'mess-menu' });
          console.log('✅ Mess menu text extracted successfully');
        } catch (error) {
          console.error('Error processing mess menu:', error);
          toast.warning('Could not read mess menu. Continuing with general meal plan.', { id: 'mess-menu' });
          messMenuText = '';
          livesInHostel = false;
        }
      }

      // Step 1: Update user profile
      setCurrentStep('Updating profile');
      console.log('📝 Updating user profile...');
      
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
          additionalInfo: {
            goalDescription: formData.goalDescription,
            challenges: formData.challenges,
            expectations: formData.expectations,
            livesInHostel: livesInHostel,
            messMenuText: messMenuText,
          },
          workoutPreferences: {
            gymTiming: formData.gymTiming || '',
            workoutDays: formData.workoutDays || 5,
            preferredType: formData.preferredType || 'both',
            availableEquipment: formData.availableEquipment || [],
            experience: formData.experience || 'beginner',
            focusAreas: formData.focusAreas || []
          }
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      console.log('✅ Profile updated successfully');
      toast.success('Profile updated successfully!');

      // Step 2: Generate diet plan
      setCurrentStep('Generating diet plan');
      console.log('🤖 Generating diet plan...');
      toast.loading('Creating your personalized diet plan...', { id: 'diet-gen' });
      
      const dietResponse = await fetch('/api/diet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalDescription: formData.goalDescription,
          challenges: formData.challenges,
          expectations: formData.expectations,
          livesInHostel: livesInHostel,
          messMenuText: messMenuText,
        }),
      });

      if (!dietResponse.ok) {
        const errorData = await dietResponse.json();
        console.error('❌ Diet generation error:', errorData);
        toast.dismiss('diet-gen');
        const errorMsg = errorData.details || errorData.error || 'Failed to generate diet plan';
        setErrorDetails(errorMsg);
        
        // Provide specific error feedback
        if (errorMsg.includes('API key') || errorMsg.includes('GEMINI_API_KEY')) {
          throw new Error('Gemini API configuration error. Please check your API key in environment variables.');
        } else if (errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('API quota exceeded. Please wait a moment and try again.');
        } else if (errorMsg.includes('parse') || errorMsg.includes('JSON')) {
          throw new Error('Failed to process AI response. Please try again.');
        } else {
          throw new Error(errorMsg);
        }
      }

      const dietData = await dietResponse.json();
      console.log('✅ Diet plan generated successfully');
      toast.success('Diet plan created!', { id: 'diet-gen' });

      // Step 3: Generate workout plan (if preferences provided)
      if (formData.gymTiming || formData.preferredType) {
        setCurrentStep('Generating workout plan');
        console.log('🏋️ Generating workout plan...');
        toast.loading('Creating your workout routine...', { id: 'workout-gen' });
        
        try {
          const workoutResponse = await fetch('/api/workout/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gymTiming: formData.gymTiming,
              workoutDays: formData.workoutDays || 5,
              preferredType: formData.preferredType || 'both',
              availableEquipment: formData.availableEquipment || [],
              experience: formData.experience || 'beginner',
              focusAreas: formData.focusAreas || []
            }),
          });

          if (workoutResponse.ok) {
            const workoutData = await workoutResponse.json();
            console.log('✅ Workout plan generated successfully');
            toast.success('Workout plan ready!', { id: 'workout-gen' });
          } else {
            const errorData = await workoutResponse.json();
            console.warn('⚠️ Workout plan generation failed:', errorData);
            toast.dismiss('workout-gen');
            toast.warning('Workout plan will be generated later. Diet plan is ready!', { id: 'workout-gen' });
            // Don't throw error - continue with diet plan only
          }
        } catch (workoutError: any) {
          console.error('Workout generation error:', workoutError);
          toast.warning('Workout plan will be generated later. Diet plan is ready!', { id: 'workout-gen' });
          // Don't throw error - continue with diet plan only
        }
      }

      // Success! Navigate to dashboard
      setCurrentStep('Complete');
      toast.success('Your personalized nutrition plan is ready! 🎉');
      
      // Small delay to show success message
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Onboarding error:', error);
      toast.dismiss('diet-gen');
      toast.dismiss('workout-gen');
      toast.dismiss('mess-menu');
      const errorMessage = error.message || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      setErrorDetails(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep || 'Processing...'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Our AI is creating your personalized plan
          </p>
          
          <div className="mt-8 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p className={currentStep.includes('profile') ? 'text-blue-600 font-semibold' : ''}>
              ✓ Setting up your profile
            </p>
            <p className={currentStep.includes('diet') ? 'text-blue-600 font-semibold' : currentStep.includes('workout') || currentStep === 'Complete' ? 'text-green-600' : ''}>
              {currentStep.includes('diet') ? '⏳' : currentStep.includes('workout') || currentStep === 'Complete' ? '✓' : '○'} Generating diet plan
            </p>
            <p className={currentStep.includes('workout') ? 'text-blue-600 font-semibold' : currentStep === 'Complete' ? 'text-green-600' : ''}>
              {currentStep.includes('workout') ? '⏳' : currentStep === 'Complete' ? '✓' : '○'} Creating workout routine
            </p>
          </div>
          
          {errorDetails && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">Error Details:</p>
              <p className="text-xs text-red-600 dark:text-red-400 break-words">{errorDetails}</p>
              
              <div className="mt-4">
                <button
                  onClick={() => {
                    setLoading(false);
                    setErrorDetails('');
                    setCurrentStep('');
                  }}
                  className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
                >
                  ← Go back and try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}