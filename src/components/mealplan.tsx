'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, ChefHat, Clock, DollarSign, 
  Utensils, Info, Heart, Sparkles, Calendar
} from 'lucide-react';

export default function MealPlanPage() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ];

  useEffect(() => {
    fetchDietPlan();
    const today = new Date().getDay();
    setSelectedDay(days[today === 0 ? 6 : today - 1].key);
  }, []);

  const fetchDietPlan = async () => {
    try {
      const res = await fetch('/api/diet');
      if (res.ok) {
        const data = await res.json();
        setDietPlan(data.dietPlan);
      }
    } catch (error) {
      console.error('Error fetching diet plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No meal plan available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayPlan = dietPlan.weeklyPlan[selectedDay];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Your Meal Plan</h1>
                <p className="text-sm text-gray-600">7-day personalized nutrition</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Day Selector */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {days.map((day) => (
                <Button
                  key={day.key}
                  variant={selectedDay === day.key ? 'default' : 'outline'}
                  className={`flex-shrink-0 ${
                    selectedDay === day.key 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : ''
                  }`}
                  onClick={() => setSelectedDay(day.key)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {day.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 capitalize">{selectedDay}&apos;s Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Total Calories</p>
                <p className="text-2xl font-bold">{dayPlan?.dailyTotal?.calories}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Protein</p>
                <p className="text-2xl font-bold">{dayPlan?.dailyTotal?.protein}g</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Carbs</p>
                <p className="text-2xl font-bold">{dayPlan?.dailyTotal?.carbs}g</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Est. Cost</p>
                <p className="text-2xl font-bold">₹{dayPlan?.dailyTotal?.cost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        <div className="space-y-6">
          {dayPlan?.meals?.map((meal: any, mealIdx: number) => (
            <Card key={mealIdx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="cursor-pointer" onClick={() => setExpandedMeal(expandedMeal === mealIdx ? null : mealIdx)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
                      <Utensils className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{meal.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meal.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">₹{meal.totalCost}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">{meal.totalCalories} cal</Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedMeal === mealIdx && (
                <CardContent>
                  <div className="space-y-4">
                    {meal.foods?.map((food: any, foodIdx: number) => (
                      <div key={foodIdx} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-blue-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <ChefHat className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-lg">{food.item}</h4>
                              <p className="text-sm text-gray-600">{food.quantity}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">{food.calories} cal</Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="bg-blue-100 rounded p-2 text-center">
                            <p className="text-xs text-gray-600 mb-1">Protein</p>
                            <p className="font-bold text-blue-600">{food.protein}g</p>
                          </div>
                          <div className="bg-green-100 rounded p-2 text-center">
                            <p className="text-xs text-gray-600 mb-1">Carbs</p>
                            <p className="font-bold text-green-600">{food.carbs}g</p>
                          </div>
                          <div className="bg-orange-100 rounded p-2 text-center">
                            <p className="text-xs text-gray-600 mb-1">Fats</p>
                            <p className="font-bold text-orange-600">{food.fats}g</p>
                          </div>
                          <div className="bg-purple-100 rounded p-2 text-center">
                            <p className="text-xs text-gray-600 mb-1">Cost</p>
                            <p className="font-bold text-purple-600">₹{food.estimatedCost}</p>
                          </div>
                        </div>

                        {food.recipe && (
                            <div className="bg-white border border-blue-200 rounded-lg p-4 mb-3 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Info className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-900">Recipe</span>
                              </div>
                              <ul className="space-y-2 list-none">
                                {food.recipe
                                  // ✅ smarter split: only break at a period + space or two+ newlines
                                  .split(/(?:\.\s+|\n{2,})/)
                                  .map((line: string) => line.replace(/\s+/g, ' ').trim()) // normalize spaces
                                  .filter((line: string) => line.length > 3)
                                  .map((step: string, i: number) => {
                                    let cleanStep = step.trim();
                                    cleanStep = cleanStep.replace(/^[\d\-\*•]+[\.\)\s]*/, '');

                                    return (
                                      <li key={i} className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                          {i + 1}
                                        </span>
                                        <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{cleanStep}</p>
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>
                          )}


                        {food.benefits && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-gray-900">Health Benefits</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{food.benefits}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-5 mt-4 border border-blue-200">
                      <h4 className="font-bold text-gray-900 mb-3 text-center">Meal Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Calories</p>
                          <p className="text-xl font-bold text-gray-900">{meal.totalCalories}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Protein</p>
                          <p className="text-xl font-bold text-blue-600">{meal.totalProtein}g</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Carbs</p>
                          <p className="text-xl font-bold text-green-600">{meal.totalCarbs}g</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                          <p className="text-xl font-bold text-purple-600">₹{meal.totalCost}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Weekly Summary */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Average Daily Calories</p>
                <p className="text-4xl font-bold text-blue-600">{dietPlan.dailyCalories}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Daily Protein Target</p>
                <p className="text-4xl font-bold text-green-600">{dietPlan.dailyProtein}g</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-2">Estimated Weekly Cost</p>
                <p className="text-4xl font-bold text-purple-600">
                  ₹{Object.values(dietPlan.weeklyPlan).reduce((sum: number, day: any) => sum + (day.dailyTotal?.cost || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}