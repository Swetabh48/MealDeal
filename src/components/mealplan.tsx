'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, ChefHat, Clock, Calendar, Utensils, Info, Heart, 
  Sparkles, TrendingUp, Plus, X, Check, AlertCircle,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';

export default function MealPlanPage() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [showCustomMealDialog, setShowCustomMealDialog] = useState(false);
  const [customMealData, setCustomMealData] = useState({
    mealType: 'Breakfast',
    mealName: '',
    foods: [{ item: '', quantity: '', brand: '' }]
  });

  const days = [
    { key: 'monday', label: 'Mon', fullName: 'Monday' },
    { key: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
    { key: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
    { key: 'thursday', label: 'Thu', fullName: 'Thursday' },
    { key: 'friday', label: 'Fri', fullName: 'Friday' },
    { key: 'saturday', label: 'Sat', fullName: 'Saturday' },
    { key: 'sunday', label: 'Sun', fullName: 'Sunday' }
  ];

  useEffect(() => {
    fetchDietPlan();
    const today = new Date().getDay();
    setSelectedDay(days[today === 0 ? 6 : today - 1].key);
    checkAndRegeneratePlan();
  }, []);

  const checkAndRegeneratePlan = async () => {
    const lastRegeneration = localStorage.getItem('lastPlanRegeneration');
    const now = new Date();
    
    // Check if it's Sunday night (after 11 PM)
    const isSundayNight = now.getDay() === 0 && now.getHours() >= 23;
    
    if (isSundayNight) {
      // Check if we haven't regenerated this week yet
      if (!lastRegeneration) {
        await regenerateDietPlan();
        return;
      }
      
      const lastRegen = new Date(lastRegeneration);
      const daysSinceLastRegen = Math.floor((now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only regenerate if it's been at least 6 days
      if (daysSinceLastRegen >= 6) {
        await regenerateDietPlan();
      }
    }
  };

  const regenerateDietPlan = async () => {
    console.log('🔄 Auto-regenerating weekly meal plan...');
    try {
      const res = await fetch('/api/diet/auto-regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        localStorage.setItem('lastPlanRegeneration', new Date().toISOString());
        await fetchDietPlan();
        console.log('✅ New weekly plan generated automatically');
      }
    } catch (error) {
      console.error('❌ Error regenerating plan:', error);
    }
  };

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

  const addFoodItem = () => {
    setCustomMealData({
      ...customMealData,
      foods: [...customMealData.foods, { item: '', quantity: '', brand: '' }]
    });
  };

  const removeFoodItem = (index: number) => {
    const newFoods = customMealData.foods.filter((_, i) => i !== index);
    setCustomMealData({ ...customMealData, foods: newFoods });
  };

  const updateFoodItem = (index: number, field: string, value: any) => {
    const newFoods = [...customMealData.foods];
    newFoods[index] = { ...newFoods[index], [field]: value };
    setCustomMealData({ ...customMealData, foods: newFoods });
  };

  const handleCustomMealSubmit = async () => {
    try {
      toast.loading('AI is analyzing your meal...', { id: 'custom-meal' });
      
      const mealLog = {
        date: new Date(),
        mealType: customMealData.mealType,
        mealName: customMealData.mealName,
        foods: customMealData.foods,
        totalCalories: 0,
        isCustom: true
      };

      const res = await fetch('/api/meals/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealLog)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Meal logged! ${data.customMeal.totalCalories} calories`, { id: 'custom-meal' });
        setShowCustomMealDialog(false);
        setCustomMealData({
          mealType: 'Breakfast',
          mealName: '',
          foods: [{ item: '', quantity: '', brand: '' }]
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to log meal', { id: 'custom-meal' });
      }
    } catch (error) {
      console.error('Error logging custom meal:', error);
      toast.error('Something went wrong', { id: 'custom-meal' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No meal plan available</p>
            <Link href="/onboarding">
              <Button>Create Your Plan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayPlan = dietPlan.weeklyPlan[selectedDay];
  const selectedDayInfo = days.find(d => d.key === selectedDay);

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
                <h1 className="text-xl font-bold">Weekly Meal Plan</h1>
                <p className="text-sm text-gray-600">Personalized nutrition for your goals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomMealDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Custom Meal
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Overview Card */}
        <Card className="mb-6 border-0 shadow-xl overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Your Weekly Plan</h2>
                </div>
                <p className="text-purple-100 text-sm mb-1">
                  🤖 Plan automatically regenerates every Sunday at 11 PM
                </p>
                <p className="text-purple-200 text-xs">
                  Each week gets fresh, different meals to keep your diet interesting!
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-purple-100 mb-1">Daily Target</p>
                <p className="text-2xl font-bold">{dietPlan.dailyCalories}</p>
                <p className="text-xs text-purple-100">calories</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-purple-100 mb-1">Protein</p>
                <p className="text-2xl font-bold">{dietPlan.dailyProtein}g</p>
                <p className="text-xs text-purple-100">per day</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-purple-100 mb-1">Carbs</p>
                <p className="text-2xl font-bold">{dietPlan.dailyCarbs}g</p>
                <p className="text-xs text-purple-100">per day</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-purple-100 mb-1">Fats</p>
                <p className="text-2xl font-bold">{dietPlan.dailyFats}g</p>
                <p className="text-xs text-purple-100">per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Selector */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-3">
              {days.map((day) => {
                const isToday = day.key === days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key;
                const isSelected = selectedDay === day.key;
                
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`relative group transition-all duration-200 ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <div className={`
                      px-4 py-5 rounded-xl border-2 transition-all text-center
                      ${isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-lg' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}>
                      <p className={`text-xs font-semibold mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {day.label}
                      </p>
                      <p className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {day.fullName.slice(0, 3)}
                      </p>
                      {isToday && (
                        <div className="absolute top-2 right-2">
                          <span className="flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-lg">{selectedDayInfo?.fullName}&apos;s Nutrition Summary</span>
              </div>
              <Badge className="bg-green-500 text-white px-3 py-1">
                {dayPlan?.meals?.length || 0} Meals
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Calories</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">{dayPlan?.dailyTotal?.calories}</p>
                <p className="text-xs text-blue-600 mt-1">kcal</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Protein</p>
                </div>
                <p className="text-3xl font-bold text-green-900">{dayPlan?.dailyTotal?.protein}</p>
                <p className="text-xs text-green-600 mt-1">grams</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Carbs</p>
                </div>
                <p className="text-3xl font-bold text-orange-900">{dayPlan?.dailyTotal?.carbs}</p>
                <p className="text-xs text-orange-600 mt-1">grams</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-red-600" />
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Fats</p>
                </div>
                <p className="text-3xl font-bold text-red-900">{dayPlan?.dailyTotal?.fats}</p>
                <p className="text-xs text-red-600 mt-1">grams</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Cost</p>
                </div>
                <p className="text-3xl font-bold text-purple-900">₹{dayPlan?.dailyTotal?.cost}</p>
                <p className="text-xs text-purple-600 mt-1">rupees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Section */}
        <div className="space-y-4">
          {dayPlan?.meals?.map((meal: any, mealIdx: number) => (
            <Card 
              key={mealIdx} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <CardHeader 
                className="cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === mealIdx ? null : mealIdx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-xl shadow-md">
                      <Utensils className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-1">{meal.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meal.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {meal.totalCost}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{meal.foods?.length} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {meal.totalCalories} cal
                    </Badge>
                    <div className={`transition-transform duration-200 ${expandedMeal === mealIdx ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedMeal === mealIdx && (
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {meal.foods?.map((food: any, foodIdx: number) => (
                      <div key={foodIdx} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative border-2 border-gray-100 rounded-xl p-5 hover:border-blue-200 transition-colors bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-2 rounded-lg">
                                <ChefHat className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900">{food.item}</h4>
                                <p className="text-sm text-gray-600 mt-1">{food.quantity}</p>
                                {food.brand && (
                                  <p className="text-xs text-purple-600 font-medium mt-1">Brand: {food.brand}</p>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm px-3 py-1">
                              {food.calories} cal
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                              <p className="text-xs text-gray-600 mb-1">Protein</p>
                              <p className="font-bold text-blue-600">{food.protein}g</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">Carbs</p>
                              <p className="font-bold text-green-600">{food.carbs}g</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                              <p className="text-xs text-gray-600 mb-1">Fats</p>
                              <p className="font-bold text-orange-600">{food.fats}g</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
                              <p className="text-xs text-gray-600 mb-1">Cost</p>
                              <p className="font-bold text-purple-600">₹{food.estimatedCost}</p>
                            </div>
                          </div>

                          {food.recipe && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Info className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-gray-900">How to Prepare</span>
                              </div>
                              <ul className="space-y-3">
                                {food.recipe
                                  .split(/(?:\.\s+|\n{2,})/)
                                  .map((line: string) => line.replace(/\s+/g, ' ').trim())
                                  .filter((line: string) => line.length > 3)
                                  .map((step: string, i: number) => {
                                    const cleanStep = step.trim().replace(/^[\d\-\*•]+[\.\)\s]*/, '');
                                    return (
                                      <li key={i} className="flex gap-3 items-start">
                                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                          {i + 1}
                                        </span>
                                        <p className="text-sm text-gray-700 leading-relaxed pt-1">{cleanStep}</p>
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>
                          )}

                          {food.benefits && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-gray-900">Health Benefits</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{food.benefits}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 mt-6 border-2 border-indigo-200">
                      <h4 className="font-bold text-gray-900 mb-4 text-center text-lg">Meal Nutrition Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-2">Total Calories</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {meal.totalCalories}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-2">Protein</p>
                          <p className="text-3xl font-bold text-blue-600">{meal.totalProtein}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-2">Carbs</p>
                          <p className="text-3xl font-bold text-green-600">{meal.totalCarbs}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-2">Total Cost</p>
                          <p className="text-3xl font-bold text-purple-600">₹{meal.totalCost}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Weekly Cost Summary */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6" />
              Weekly Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold mb-2">
                ₹{Object.values(dietPlan.weeklyPlan).reduce((sum: number, day: any) => sum + (day.dailyTotal?.cost || 0), 0)}
              </p>
              <p className="text-purple-100">Total for 7 days</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Custom Meal Dialog */}
      <Dialog open={showCustomMealDialog} onOpenChange={setShowCustomMealDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Log Custom Meal
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Couldn&apos;t follow the plan? No worries! Log what you actually ate and our AI will track it for you.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meal Type</Label>
                <select
                  value={customMealData.mealType}
                  onChange={(e) => setCustomMealData({ ...customMealData, mealType: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                >
                  <option>Breakfast</option>
                  <option>Mid-Morning Snack</option>
                  <option>Lunch</option>
                  <option>Evening Snack</option>
                  <option>Dinner</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Meal Name</Label>
                <Input
                  value={customMealData.mealName}
                  onChange={(e) => setCustomMealData({ ...customMealData, mealName: e.target.value })}
                  placeholder="e.g., Chicken Biryani from Restaurant"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Food Items</Label>
                <Button type="button" onClick={addFoodItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {customMealData.foods.map((food, idx) => (
                <div key={idx} className="border-2 border-gray-200 rounded-xl p-4 space-y-3 relative bg-gray-50">
                  {customMealData.foods.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodItem(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Food Item *</Label>
                      <Input
                        value={food.item}
                        onChange={(e) => updateFoodItem(idx, 'item', e.target.value)}
                        placeholder="e.g., Chicken Breast"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        value={food.quantity}
                        onChange={(e) => updateFoodItem(idx, 'quantity', e.target.value)}
                        placeholder="e.g., 150g or 2 pieces"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Brand/Store</Label>
                      <Input
                        value={food.brand}
                        onChange={(e) => updateFoodItem(idx, 'brand', e.target.value)}
                        placeholder="e.g., KFC, Local Market"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      ✨ <strong>AI will automatically calculate:</strong> Calories, Protein, Carbs, Fats, and Health Score
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">AI-Powered Analysis</span>
              </div>
              <p className="text-sm text-green-700">
                Our AI will analyze your meal and provide accurate nutritional information including calories, macros, and health recommendations.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCustomMealDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={handleCustomMealSubmit}
                disabled={!customMealData.mealName || customMealData.foods.some(f => !f.item || !f.quantity)}
              >
                <Check className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}