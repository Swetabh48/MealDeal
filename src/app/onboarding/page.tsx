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
      throw new Error('Failed to extract text from image');
    }

    const data = await response.json();
    
    // Check if text extraction was successful
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
      // Remove data URL prefix
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

  const handleComplete = async (formData: any) => {
    setLoading(true);
    setErrorDetails('');
    
    try {
      console.log('📝 Processing onboarding data...');
      
      // Extract mess menu text if provided
      let messMenuText = '';
      let livesInHostel = formData.livesInHostel;
      
      if (formData.livesInHostel && formData.messMenu) {
        try {
          toast.loading('Reading mess menu...', { id: 'mess-menu' });
          messMenuText = await extractTextFromImage(formData.messMenu);
          toast.success('Mess menu processed!', { id: 'mess-menu' });
          console.log('✅ Mess menu text extracted successfully');
          console.log('Extracted text length:', messMenuText.length);
        } catch (error) {
          console.error('Error processing mess menu:', error);
          toast.warning('Could not read mess menu. Continuing with general meal plan.', { id: 'mess-menu' });
          // Reset hostel flag if menu extraction fails
          messMenuText = '';
          livesInHostel = false;
          console.log('⚠️ Reverting to non-hostel plan due to menu extraction failure');
        }
      }

      console.log('📝 Updating user profile...');
      
      // Update user profile
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
          livesInHostel: livesInHostel,
          messMenuText: messMenuText,
        }),
      });

      if (!dietResponse.ok) {
        const errorData = await dietResponse.json();
        console.error('❌ Diet generation error:', errorData);
        
        const errorMsg = errorData.details || errorData.error || 'Failed to generate diet plan';
        setErrorDetails(errorMsg);
        
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Creating Your Personalized Plan...</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Our AI is analyzing your profile and generating the perfect nutrition plan for you</p>
          <div className="mt-8 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>✓ Analyzing your health goals</p>
            <p>✓ Finding locally available ingredients</p>
            <p>✓ Calculating nutritional requirements</p>
            <p>✓ Creating your meal plans</p>
          </div>
          
          {errorDetails && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">Error Details:</p>
              <p className="text-xs text-red-600 dark:text-red-400">{errorDetails}</p>
              <div className="mt-3 text-xs text-red-700 dark:text-red-400">
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