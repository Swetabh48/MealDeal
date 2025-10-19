'use client';

import React, { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: (formData: any) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    goal: 'weight_loss',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 p-4">
      <h2 className="text-2xl font-bold text-center">Complete Your Profile</h2>

      {/* Example input */}
      <input
        type="number"
        placeholder="Age"
        value={formData.age}
        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
        className="w-full p-2 border rounded"
        required
      />

      {/* Add other fields for gender, height, weight, activity level, goal */}

      <button
        type="submit"
        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Complete Onboarding
      </button>
    </form>
  );
}
