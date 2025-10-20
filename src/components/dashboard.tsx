'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Apple, Calendar, MessageCircle, 
  ChevronRight, Activity, Droplets,
  Heart, Clock, ChefHat, Check, Menu,
  Home, TrendingUp, BookOpen, User, X, LogOut
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface MealLog {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: Date;
}

interface DietPlan {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  weeklyPlan: Record<string, any>;
  recommendations: string[];
  hydration: string;
  generatedAt: string;
}

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState('');
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loggedMealNames, setLoggedMealNames] = useState<string[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustingMeal, setAdjustingMeal] = useState<any>(null);
  const [foodAdjustments, setFoodAdjustments] = useState<Record<number, string>>({});

  useEffect(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    setCurrentDay(today);

    fetchData();
    loadTodayLogs();
  }, []);

  const fetchData = async () => {
    try {
      const [dietRes, profileRes] = await Promise.all([
        fetch('/api/diet'),
        fetch('/api/user/profile')
      ]);

      if (dietRes.ok) {
        const dietData = await dietRes.json();
        setDietPlan(dietData.dietPlan);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData.user);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayLogs = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`meal_logs_${today}`);
    const waterStored = localStorage.getItem(`water_${today}`);
    const loggedNames = localStorage.getItem(`logged_meals_${today}`);
    if (stored) setMealLogs(JSON.parse(stored));
    if (waterStored) setWaterGlasses(parseInt(waterStored));
    if (loggedNames) setLoggedMealNames(JSON.parse(loggedNames));
  };

  const saveLogs = (logs: MealLog[]) => {
    const today = new Date().toDateString();
    localStorage.setItem(`meal_logs_${today}`, JSON.stringify(logs));
    setMealLogs(logs);
  };

  const saveLoggedMealNames = (names: string[]) => {
    const today = new Date().toDateString();
    localStorage.setItem(`logged_meals_${today}`, JSON.stringify(names));
    setLoggedMealNames(names);
  };

  const saveWater = (count: number) => {
    const today = new Date().toDateString();
    localStorage.setItem(`water_${today}`, count.toString());
    setWaterGlasses(count);
  };

  const logMeal = (meal: any) => {
    const totalNutrition = meal.foods.reduce((acc: any, food: any, idx: number) => {
      const consumed = parseFloat(foodAdjustments[idx] || '0');
      const quantity = parseFloat(food.quantity.match(/\d+/)?.[0] || '1');
      const ratio = consumed / quantity;
      
      return {
        calories: acc.calories + (food.calories * ratio),
        protein: acc.protein + (food.protein * ratio),
        carbs: acc.carbs + (food.carbs * ratio),
        fats: acc.fats + (food.fats * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const newLog: MealLog = {
      mealName: meal.name,
      calories: Math.round(totalNutrition.calories),
      protein: Math.round(totalNutrition.protein * 10) / 10,
      carbs: Math.round(totalNutrition.carbs * 10) / 10,
      fats: Math.round(totalNutrition.fats * 10) / 10,
      timestamp: new Date()
    };

    saveLogs([...mealLogs, newLog]);
    saveLoggedMealNames([...loggedMealNames, meal.name]);
    setShowAdjustmentModal(false);
    setFoodAdjustments({});
  };

  const openAdjustmentModal = (meal: any) => {
    setAdjustingMeal(meal);
    const defaultAdjustments: Record<number, string> = {};
    meal.foods.forEach((food: any, idx: number) => {
      const quantity = food.quantity.match(/\d+/)?.[0] || '1';
      defaultAdjustments[idx] = quantity;
    });
    setFoodAdjustments(defaultAdjustments);
    setShowAdjustmentModal(true);
  };

  const isMealTimeReached = (mealTime: string) => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const [time, period] = mealTime.split(' ');
    const [hour, minute] = time.split(':').map(Number);
    let mealHour = hour;
    
    if (period === 'PM' && hour !== 12) mealHour += 12;
    if (period === 'AM' && hour === 12) mealHour = 0;
    
    const mealTimeInMinutes = mealHour * 60 + (minute || 0);
    
    return currentTimeInMinutes >= mealTimeInMinutes;
  };

  const getConsumedNutrition = () => {
    return mealLogs.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const getTodaysMeals = () => {
    if (!dietPlan || !currentDay) return [];
    return dietPlan.weeklyPlan[currentDay]?.meals || [];
  };

  const getCurrentMeal = () => {
    const meals = getTodaysMeals();
    const currentHour = new Date().getHours();
    
    if (currentHour < 9) return meals[0];
    if (currentHour < 11) return meals[1];
    if (currentHour < 15) return meals[2];
    if (currentHour < 18) return meals[3];
    return meals[4];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Apple className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Welcome to MealDeal!</h2>
              <p className="text-xl text-gray-600 mb-8">
                Let&apos;s create your personalized nutrition plan
              </p>
              <Button 
                size="lg"
                onClick={() => router.push('/onboarding')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentMeal = getCurrentMeal();
  const consumed = getConsumedNutrition();
  const caloriesPercent = dietPlan.dailyCalories ? (consumed.calories / dietPlan.dailyCalories) * 100 : 0;
  const proteinPercent = dietPlan.dailyProtein ? (consumed.protein / dietPlan.dailyProtein) * 100 : 0;
  const carbsPercent = dietPlan.dailyCarbs ? (consumed.carbs / dietPlan.dailyCarbs) * 100 : 0;
  const fatsPercent = dietPlan.dailyFats ? (consumed.fats / dietPlan.dailyFats) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header with Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-rose-500 bg-clip-text text-transparent">
                MealDeal
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 font-medium">
                <Home className="w-5 h-5" />
                Home
              </Link>
              <Link href="/meal-plan" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                <Calendar className="w-5 h-5" />
                Meal Plan
              </Link>
              <Link href="/progress" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                <TrendingUp className="w-5 h-5" />
                Progress
              </Link>
              <Link href="/recommendations" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                <BookOpen className="w-5 h-5" />
                Tips
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                <User className="w-5 h-5" />
                Profile
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-3">
                <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 font-medium py-2">
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                <Link href="/meal-plan" className="flex items-center gap-2 text-gray-600 py-2">
                  <Calendar className="w-5 h-5" />
                  Meal Plan
                </Link>
                <Link href="/progress" className="flex items-center gap-2 text-gray-600 py-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress
                </Link>
                <Link href="/recommendations" className="flex items-center gap-2 text-gray-600 py-2">
                  <BookOpen className="w-5 h-5" />
                  Tips
                </Link>
                <Link href="/profile" className="flex items-center gap-2 text-gray-600 py-2">
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 py-2 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {userProfile?.name || 'Friend'}! 👋
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Nutrition - Priority #1 */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Today&apos;s Nutrition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{consumed.calories}</div>
                    <div className="text-xs text-gray-600">/ {dietPlan.dailyCalories}</div>
                    <div className="text-xs font-medium text-gray-700 mt-1">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{consumed.protein}g</div>
                    <div className="text-xs text-gray-600">/ {dietPlan.dailyProtein}g</div>
                    <div className="text-xs font-medium text-gray-700 mt-1">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{consumed.carbs}g</div>
                    <div className="text-xs text-gray-600">/ {dietPlan.dailyCarbs}g</div>
                    <div className="text-xs font-medium text-gray-700 mt-1">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{consumed.fats}g</div>
                    <div className="text-xs text-gray-600">/ {dietPlan.dailyFats}g</div>
                    <div className="text-xs font-medium text-gray-700 mt-1">Fats</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Calories</span>
                      <span className="text-sm text-gray-600">{Math.round(caloriesPercent)}%</span>
                    </div>
                    <Progress value={Math.min(caloriesPercent, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Protein</span>
                      <span className="text-sm text-gray-600">{Math.round(proteinPercent)}%</span>
                    </div>
                    <Progress value={Math.min(proteinPercent, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Carbs</span>
                      <span className="text-sm text-gray-600">{Math.round(carbsPercent)}%</span>
                    </div>
                    <Progress value={Math.min(carbsPercent, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Fats</span>
                      <span className="text-sm text-gray-600">{Math.round(fatsPercent)}%</span>
                    </div>
                    <Progress value={Math.min(fatsPercent, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Meal - Priority #2 */}
            {currentMeal && !loggedMealNames.includes(currentMeal.name) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Next: {currentMeal.name}
                    </CardTitle>
                    <Badge className="bg-white text-purple-600 text-sm">
                      {currentMeal.time}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {currentMeal.foods?.slice(0, 3).map((food: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-2">
                        <ChefHat className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{food.item}</p>
                          <p className="text-xs text-blue-100">{food.quantity}</p>
                        </div>
                        <p className="text-xs font-semibold whitespace-nowrap">{food.calories} cal</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {isMealTimeReached(currentMeal.time) ? (
                      <Button 
                        className="flex-1 bg-white text-purple-600 hover:bg-blue-50 h-10"
                        onClick={() => openAdjustmentModal(currentMeal)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark Eaten
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 bg-white/30 text-white cursor-not-allowed h-10"
                        disabled
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Not Yet Time
                      </Button>
                    )}
                    <Link href="/meal-plan" className="flex-1">
                      <Button className="w-full bg-white/20 hover:bg-white/30 text-white h-10">
                        View Plan
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Meals Log */}
            {mealLogs.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">Meals Eaten Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mealLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{log.mealName}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-green-600">{log.calories}</p>
                          <p className="text-xs text-gray-600">{log.protein}p • {log.carbs}c</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Column */}
          <div className="space-y-6">
            {/* Water Tracker */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
              <CardContent className="p-6">
                <Droplets className="w-10 h-10 mb-3" />
                <h3 className="text-xl font-bold mb-2">Water Intake</h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-4xl font-bold mb-1">{waterGlasses}</p>
                  <p className="text-sm text-cyan-50 mb-3">of 8 glasses</p>
                  <div className="flex justify-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white/20 border-white/40 text-white hover:bg-white/30 w-12 h-10"
                      onClick={() => waterGlasses > 0 && saveWater(waterGlasses - 1)}
                    >
                      -
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white/20 border-white/40 text-white hover:bg-white/30 w-12 h-10"
                      onClick={() => saveWater(waterGlasses + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips - Simplified */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dietPlan.recommendations?.slice(0, 2).map((rec: string, idx: number) => {
                    const cleanRec = rec.replace(/\*\*/g, '').split('.')[0] + '.';
                    return (
                      <div key={idx} className="flex gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{cleanRec}</p>
                      </div>
                    );
                  })}
                </div>
                <Link href="/recommendations">
                  <Button variant="ghost" className="w-full mt-3 text-sm hover:bg-blue-50">
                    View All Tips
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => router.push('/doctor-chat')}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all z-50"
        aria-label="Chat with AI Doctor"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Meal Adjustment Modal */}
      {showAdjustmentModal && adjustingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">How Much Did You Eat?</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Enter the actual quantity you consumed for each item
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {adjustingMeal.foods.map((food: any, idx: number) => {
                  const consumed = parseFloat(foodAdjustments[idx] || '0');
                  const original = parseFloat(food.quantity.match(/\d+/)?.[0] || '1');
                  const ratio = consumed / original;
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg">{food.item}</p>
                          <p className="text-sm text-gray-600">Suggested: {food.quantity}</p>
                        </div>
                        <Badge variant="outline">{food.calories} cal each</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium block mb-2">I ate:</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={foodAdjustments[idx] || ''}
                              onChange={(e) => setFoodAdjustments({
                                ...foodAdjustments,
                                [idx]: e.target.value
                              })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                              placeholder="0"
                            />
                            <span className="text-gray-600 font-medium">
                              {food.quantity.replace(/\d+/, '').trim()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Nutritional calculation:</p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-sm font-bold text-blue-600">
                                {Math.round(food.calories * ratio)} cal
                              </p>
                              <p className="text-xs text-gray-500">Calories</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-600">
                                {Math.round(food.protein * ratio * 10) / 10}g
                              </p>
                              <p className="text-xs text-gray-500">Protein</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-orange-600">
                                {Math.round(food.carbs * ratio * 10) / 10}g
                              </p>
                              <p className="text-xs text-gray-500">Carbs</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setFoodAdjustments({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => logMeal(adjustingMeal)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm & Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}