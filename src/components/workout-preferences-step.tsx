import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, Home, Building2, Clock, Target, Info } from 'lucide-react';

interface WorkoutPreferencesStepProps {
  formData: {
    gymTiming: string;
    workoutDays: number;
    preferredType: 'gym' | 'home' | 'both';
    availableEquipment: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
    focusAreas: string[];
  };
  updateFormData: (field: string, value: any) => void;
}

export default function WorkoutPreferencesStep({ formData, updateFormData }: WorkoutPreferencesStepProps) {
  const [customEquipment, setCustomEquipment] = useState('');
  const [customFocus, setCustomFocus] = useState('');

  const commonEquipment = [
    'Dumbbells',
    'Resistance Bands',
    'Yoga Mat',
    'Pull-up Bar',
    'Treadmill',
    'Exercise Bike',
    'Kettlebells',
    'Bench',
    'None (Bodyweight only)'
  ];

  const focusAreaOptions = [
    'Weight Loss',
    'Muscle Building',
    'Core Strength',
    'Flexibility',
    'Cardiovascular Health',
    'Upper Body',
    'Lower Body',
    'Full Body',
    'Posture Improvement',
    'Stress Relief'
  ];

  const toggleArrayItem = (field: 'availableEquipment' | 'focusAreas', value: string) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      updateFormData(field, current.filter(item => item !== value));
    } else {
      updateFormData(field, [...current, value]);
    }
  };

  const addCustomItem = (field: 'availableEquipment' | 'focusAreas', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateFormData(field, [...formData[field], value.trim()]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 dark:text-white">Workout Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">Help us create your perfect workout routine</p>
      </div>

      {/* Gym Timing */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <Label htmlFor="gymTiming" className="text-lg font-semibold flex items-center gap-2 mb-3 dark:text-gray-200">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            When do you prefer to workout?
          </Label>
          <Select 
            value={formData.gymTiming} 
            onValueChange={(value) => updateFormData('gymTiming', value)}
          >
            <SelectTrigger className="h-12 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              <SelectValue placeholder="Select your workout time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="early-morning">Early Morning (5:00 AM - 7:00 AM)</SelectItem>
              <SelectItem value="morning">Morning (7:00 AM - 10:00 AM)</SelectItem>
              <SelectItem value="late-morning">Late Morning (10:00 AM - 12:00 PM)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
              <SelectItem value="evening">Evening (4:00 PM - 7:00 PM)</SelectItem>
              <SelectItem value="night">Night (7:00 PM - 10:00 PM)</SelectItem>
              <SelectItem value="flexible">Flexible / Varies</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            💡 We&apos;ll adjust your pre and post-workout meal timings accordingly
          </p>
        </CardContent>
      </Card>

      {/* Workout Type Preference */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <Label className="text-lg font-semibold flex items-center gap-2 mb-4 dark:text-gray-200">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Where do you prefer to workout?
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'gym', label: 'Gym', icon: Dumbbell },
              { value: 'home', label: 'Home', icon: Home },
              { value: 'both', label: 'Both', icon: Building2 }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData('preferredType', option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.preferredType === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <option.icon className={`w-8 h-8 mx-auto mb-2 ${
                  formData.preferredType === option.value 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                <p className={`font-semibold ${
                  formData.preferredType === option.value 
                    ? 'text-blue-900 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience Level */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <Label className="text-lg font-semibold flex items-center gap-2 mb-4 dark:text-gray-200">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            What&apos;s your fitness experience level?
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'New to fitness' },
              { value: 'intermediate', label: 'Intermediate', desc: '6+ months experience' },
              { value: 'advanced', label: 'Advanced', desc: '2+ years experience' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData('experience', option.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.experience === option.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <p className={`font-bold mb-1 ${
                  formData.experience === option.value 
                    ? 'text-purple-900 dark:text-purple-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{option.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Equipment */}
      <Card className="border-2 border-green-200 dark:border-green-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <Label className="text-lg font-semibold mb-3 block dark:text-gray-200">
            What equipment do you have access to?
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {commonEquipment.map((equipment) => (
              <button
                key={equipment}
                type="button"
                onClick={() => toggleArrayItem('availableEquipment', equipment)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all dark:bg-gray-800 ${
                  formData.availableEquipment?.includes(equipment)
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 dark:text-gray-200'
                }`}
              >
                {equipment}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customEquipment}
              onChange={(e) => setCustomEquipment(e.target.value)}
              placeholder="Add custom equipment..."
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem('availableEquipment', customEquipment);
                  setCustomEquipment('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addCustomItem('availableEquipment', customEquipment);
                setCustomEquipment('');
              }}
              className="dark:border-gray-700 dark:text-gray-200"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card className="border-2 border-rose-200 dark:border-rose-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <Label className="text-lg font-semibold mb-3 block dark:text-gray-200">
            What areas do you want to focus on?
          </Label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArrayItem('focusAreas', area)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all dark:bg-gray-800 ${
                  formData.focusAreas?.includes(area)
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:border-rose-400 dark:text-rose-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-600 dark:text-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="Add custom focus area..."
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem('focusAreas', customFocus);
                  setCustomFocus('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addCustomItem('focusAreas', customFocus);
                setCustomFocus('');
              }}
              className="dark:border-gray-700 dark:text-gray-200"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 dark:bg-blue-600 p-2 rounded-lg">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">AI-Powered Workout Plans</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on your preferences and medical conditions, our AI will create:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>✓ Personalized exercise routines with proper form instructions</li>
                <li>✓ Pre and post-workout meal suggestions timed with your workouts</li>
                <li>✓ Safe exercises considering your medical conditions (e.g., yoga for sinus)</li>
                <li>✓ Progress tracking to mark sets and reps completed</li>
                <li>✓ Weekly variety to keep you motivated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}