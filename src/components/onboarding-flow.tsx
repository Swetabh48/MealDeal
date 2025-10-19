'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  User, Activity, Target, Heart, MapPin, 
  AlertCircle, FileText, ArrowRight, ArrowLeft, Sparkles 
} from 'lucide-react';

interface FormData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goal: string;
  goalDescription: string;
  dietaryRestrictions: string[];
  customRestriction: string;
  medicalConditions: string[];
  customCondition: string;
  medicalDocuments: File[];
  budget: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  challenges: string;
  expectations: string;
}

interface OnboardingFlowProps {
  onComplete: (formData: FormData) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    goal: 'weight_loss',
    goalDescription: '',
    dietaryRestrictions: [],
    customRestriction: '',
    medicalConditions: [],
    customCondition: '',
    medicalDocuments: [],
    budget: 'middle',
    location: {
      country: 'India',
      state: '',
      city: '',
    },
    challenges: '',
    expectations: '',
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...((prev as any)[parent]), [field]: value }
    }));
  };

  const toggleArrayItem = (field: 'dietaryRestrictions' | 'medicalConditions', value: string) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(value)) {
        return { ...prev, [field]: array.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...array, value] };
      }
    });
  };

  const addCustomItem = (field: 'dietaryRestrictions' | 'medicalConditions', customField: 'customRestriction' | 'customCondition') => {
    const value = formData[customField].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value],
        [customField]: ''
      }));
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Let&apos;s Get to Know You</h2>
              <p className="text-gray-600">Tell us about yourself so we can create your perfect plan</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="age" className="text-base font-medium mb-2 block">
                  Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  placeholder="e.g., 45"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height" className="text-base font-medium mb-2 block">
                  Height (cm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateFormData('height', e.target.value)}
                  placeholder="e.g., 170"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-base font-medium mb-2 block">
                  Weight (kg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  placeholder="e.g., 75"
                  className="h-12 text-base"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Your Lifestyle</h2>
              <p className="text-gray-600">Help us understand your daily activity level</p>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                Activity Level <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-3">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise, desk job' },
                  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                  { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                  { value: 'very_active', label: 'Extremely Active', desc: 'Physical job or training twice/day' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData('activityLevel', option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.activityLevel === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Your Health Goals</h2>
              <p className="text-gray-600">What would you like to achieve?</p>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                Primary Goal <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-3">
                {[
                  { value: 'weight_loss', label: 'Lose Weight', icon: '🎯' },
                  { value: 'weight_gain', label: 'Gain Weight', icon: '💪' },
                  { value: 'muscle_gain', label: 'Build Muscle', icon: '🏋️' },
                  { value: 'maintenance', label: 'Maintain Health', icon: '❤️' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData('goal', option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.goal === option.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div className="font-semibold text-gray-900">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="goalDescription" className="text-base font-medium mb-2 block">
                Tell Us More About Your Goals
              </Label>
              <Textarea
                id="goalDescription"
                value={formData.goalDescription}
                onChange={(e) => updateFormData('goalDescription', e.target.value)}
                placeholder="Describe your health goals, challenges, and what you hope to achieve... Be as detailed as you like!"
                className="min-h-32 text-base"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 The more details you share, the better we can personalize your plan
              </p>
            </div>

            <div>
              <Label htmlFor="challenges" className="text-base font-medium mb-2 block">
                What Challenges Do You Face?
              </Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => updateFormData('challenges', e.target.value)}
                placeholder="e.g., Busy schedule, picky eater, joint pain, diabetes management..."
                className="min-h-24 text-base"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Health & Dietary Info</h2>
              <p className="text-gray-600">Help us create a safe and suitable plan for you</p>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">
                Dietary Restrictions (Select all that apply)
              </Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Halal', 'Kosher', 'Low-Carb'].map((restriction) => (
                  <button
                    key={restriction}
                    type="button"
                    onClick={() => toggleArrayItem('dietaryRestrictions', restriction)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.dietaryRestrictions.includes(restriction)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.customRestriction}
                  onChange={(e) => updateFormData('customRestriction', e.target.value)}
                  placeholder="Add custom restriction..."
                  className="h-11"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem('dietaryRestrictions', 'customRestriction'))}
                />
                <Button
                  type="button"
                  onClick={() => addCustomItem('dietaryRestrictions', 'customRestriction')}
                  variant="outline"
                  className="h-11 px-6"
                >
                  Add
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">
                Medical Conditions (Select all that apply)
              </Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {['Diabetes', 'High Blood Pressure', 'Heart Disease', 'Thyroid', 'PCOS/PCOD', 'Arthritis', 'Asthma', 'Kidney Disease'].map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleArrayItem('medicalConditions', condition)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.medicalConditions.includes(condition)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.customCondition}
                  onChange={(e) => updateFormData('customCondition', e.target.value)}
                  placeholder="Add custom condition..."
                  className="h-11"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem('medicalConditions', 'customCondition'))}
                />
                <Button
                  type="button"
                  onClick={() => addCustomItem('medicalConditions', 'customCondition')}
                  variant="outline"
                  className="h-11 px-6"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Medical Documents</h2>
              <p className="text-gray-600">Upload your prescriptions or test results for a more personalized plan</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <div className="mb-4">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Upload Medical Documents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Prescriptions, blood tests, health reports (PDF, JPG, PNG)
                </p>
              </div>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  updateFormData('medicalDocuments', files);
                }}
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-3">
                Optional but recommended for better accuracy
              </p>
            </div>

            {formData.medicalDocuments && formData.medicalDocuments.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  ✓ {formData.medicalDocuments.length} file(s) uploaded
                </p>
                <div className="space-y-1">
                  {formData.medicalDocuments.map((file: File, idx: number) => (
                    <p key={idx} className="text-xs text-green-700">
                      • {file.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Privacy & Security</p>
                  <p>Your medical documents are encrypted and stored securely. They will only be used to personalize your nutrition plan.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Location & Budget</h2>
              <p className="text-gray-600">Help us recommend locally available foods within your budget</p>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">
                Your Location <span className="text-red-500">*</span>
              </Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Select 
                    value={formData.location.country} 
                    onValueChange={(value) => updateNestedFormData('location', 'country', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    value={formData.location.state}
                    onChange={(e) => updateNestedFormData('location', 'state', e.target.value)}
                    placeholder="State/Province"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => updateNestedFormData('location', 'city', e.target.value)}
                    placeholder="City"
                    className="h-12"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                📍 We&apos;ll recommend foods that are easily available in your area
              </p>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                Monthly Budget for Nutrition <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-3">
                {[
                  { value: 'lower', label: 'Budget-Friendly', desc: '₹3,000 - ₹5,000/month', icon: '💰' },
                  { value: 'middle', label: 'Moderate', desc: '₹5,000 - ₹10,000/month', icon: '💵' },
                  { value: 'upper', label: 'Premium', desc: '₹10,000+/month', icon: '💎' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData('budget', option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.budget === option.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expectations" className="text-base font-medium mb-2 block">
                What Are Your Expectations?
              </Label>
              <Textarea
                id="expectations"
                value={formData.expectations}
                onChange={(e) => updateFormData('expectations', e.target.value)}
                placeholder="What do you expect from this nutrition plan? Any specific foods you love or hate? Preferred meal times? Tell us everything!"
                className="min-h-32 text-base"
              />
              <p className="text-sm text-gray-500 mt-2">
                💬 Share your preferences, lifestyle, and what success looks like for you
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Almost There! 🎉</h3>
                  <p className="text-sm text-green-800">
                    You&apos;re about to get a personalized nutrition plan tailored specifically for you, 
                    considering your location, budget, health conditions, and goals. Let&apos;s make this journey amazing!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.age && formData.height && formData.weight;
      case 2:
        return formData.activityLevel;
      case 3:
        return formData.goal;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return formData.location.country && formData.budget;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Your data is secure and will only be used to create your personalized plan.
        </p>
      </div>
    </div>
  );
}