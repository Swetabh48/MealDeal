'use client';

import { useEffect, useState, type MouseEvent } from 'react';
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
  ShoppingCart, Flame, Share2, FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cacheGet, cacheSet, cacheClear } from '@/lib/cache';
import { expandRecipeIfShort } from '@/lib/diet/expand-recipe';
import { shareGroceryWhatsApp, downloadGroceryPdf } from '@/lib/grocery-export';

export default function MealPlanPage() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [groceryTab, setGroceryTab] = useState<'weekly' | 'monthly'>('weekly');
  const [loggedMealNames, setLoggedMealNames] = useState<string[]>([]);
  const [checkInBusy, setCheckInBusy] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [swapPref, setSwapPref] = useState('more variety');
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null);
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
    fetchTodayCheckIns();
  }, []);

  const todayKey = (() => {
    const d = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return d[new Date().getDay()];
  })();

  const fetchTodayCheckIns = async () => {
    try {
      const res = await fetch('/api/meals/checkin');
      if (!res.ok) return;
      const data = await res.json();
      setLoggedMealNames(data.loggedMealNames || []);
      setStreak(data.currentStreak || 0);
    } catch {
      /* offline ok */
    }
  };

  const checkInMeal = async (meal: any, e: MouseEvent) => {
    e.stopPropagation();
    if (checkInBusy) return;
    setCheckInBusy(meal.name);
    try {
      const res = await fetch('/api/meals/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: meal.name,
          mealTime: meal.time,
          calories: meal.totalCalories || 0,
          protein: meal.totalProtein || 0,
          carbs: meal.totalCarbs || 0,
          fats: meal.totalFats || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLoggedMealNames(data.loggedMealNames || [...loggedMealNames, meal.name]);
        setStreak(data.currentStreak || 0);
        toast.success(
          data.currentStreak
            ? `Ate it · ${data.currentStreak}-day streak 🔥`
            : 'Meal checked in'
        );
      } else {
        toast.error('Could not check in');
      }
    } catch {
      toast.error('Check-in failed');
    } finally {
      setCheckInBusy(null);
    }
  };

  const undoMeal = async (mealName: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `/api/meals/checkin?mealName=${encodeURIComponent(mealName)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        const data = await res.json();
        setLoggedMealNames(data.loggedMealNames || []);
        setStreak(data.currentStreak || 0);
        toast.message('Check-in undone');
      }
    } catch {
      toast.error('Undo failed');
    }
  };

  const openSwap = (mealIdx: number, e: MouseEvent) => {
    e.stopPropagation();
    setSwapTargetIdx(mealIdx);
    setSwapPref('more variety / less boring');
    setShowSwapDialog(true);
  };

  const confirmSwap = async () => {
    if (swapTargetIdx == null) return;
    setSwappingIdx(swapTargetIdx);
    setShowSwapDialog(false);
    try {
      const res = await fetch('/api/meals/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: selectedDay,
          mealIndex: swapTargetIdx,
          preference: swapPref,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Swap failed');
        return;
      }
      cacheClear('yelediet:dietPlan');
      setDietPlan(data.dietPlan);
      cacheSet('yelediet:dietPlan', data.dietPlan, 30 * 60 * 1000);
      toast.success('Meal swapped — full recipe updated');
      setExpandedMeal(swapTargetIdx);
    } catch {
      toast.error('Swap failed');
    } finally {
      setSwappingIdx(null);
      setSwapTargetIdx(null);
    }
  };

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
        cacheClear('yelediet:dietPlan');
        await fetchDietPlan({ force: true });
        console.log('✅ New weekly plan generated automatically');
      }
    } catch (error) {
      console.error('❌ Error regenerating plan:', error);
    }
  };

  const fetchDietPlan = async (opts?: { force?: boolean }) => {
    try {
      if (!opts?.force) {
        const cached = cacheGet<any>('yelediet:dietPlan');
        if (cached) {
          setDietPlan(cached);
          setLoading(false);
          // Soft refresh in background
          fetch('/api/diet')
            .then(async (res) => {
              if (!res.ok) return;
              const data = await res.json();
              if (data.dietPlan) {
                cacheSet('yelediet:dietPlan', data.dietPlan, 30 * 60 * 1000);
                setDietPlan(data.dietPlan);
              }
            })
            .catch(() => {});
          return;
        }
      }

      const res = await fetch('/api/diet');
      if (res.ok) {
        const data = await res.json();
        setDietPlan(data.dietPlan);
        if (data.dietPlan) {
          cacheSet('yelediet:dietPlan', data.dietPlan, 30 * 60 * 1000);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-mesh">
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
    <div className="min-h-screen md-page bg-mesh">
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
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all">
                Dashboard
              </button>
            </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Overview Card */}
        <Card className="mb-6 border-0 shadow-xl overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
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

        {/* Grocery List — weekly vs monthly shopping */}
        {dietPlan.groceryList && (
          <Card className="mb-6 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  Grocery list
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      shareGroceryWhatsApp(dietPlan.groceryList);
                      toast.success('Opening WhatsApp…');
                    }}
                    className="px-3 py-2 rounded-full text-sm font-medium bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadGroceryPdf(dietPlan.groceryList);
                        toast.success('PDF downloaded');
                      } catch (e) {
                        console.error(e);
                        toast.error('PDF failed');
                      }
                    }}
                    className="px-3 py-2 rounded-full text-sm font-medium bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => setGroceryTab('weekly')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      groceryTab === 'weekly'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    This week
                  </button>
                  <button
                    onClick={() => setGroceryTab('monthly')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      groceryTab === 'monthly'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    Monthly staples
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Shop once from this list. Fresh produce, milk, eggs, paneer → <strong>This week</strong>.
                Oats, peanut butter, dal, atta, rice, oil → <strong>Monthly staples</strong> (easy to miss if you only open the weekly tab).
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {/* Separate tables for weekly vs monthly via tabs */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[780px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600 border-b">
                      <th className="px-3 py-3 font-semibold">Item</th>
                      <th className="px-3 py-3 font-semibold">Brand</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Qty / item</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Pack size</th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">Pack qty</th>
                      <th className="px-3 py-3 font-semibold">Price</th>
                      <th className="px-3 py-3 font-semibold">Best buy from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groceryTab === 'weekly'
                      ? dietPlan.groceryList.weekly
                      : dietPlan.groceryList.monthly
                    )?.map((row: any, idx: number) => (
                      <tr
                        key={`${row.name}-${idx}`}
                        className="border-b border-gray-100 hover:bg-emerald-50/40"
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{row.name}</p>
                          {row.nutritionInfo && (
                            <p className="text-xs text-teal-700 mt-1 font-medium">{row.nutritionInfo}</p>
                          )}
                          {row.notes && (
                            <p className="text-xs text-gray-500 mt-0.5">{row.notes}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{row.brand}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{row.qtyPerItem || '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{row.packSize || row.quantity}</td>
                        <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.packQty ?? '—'}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-700 whitespace-nowrap">
                          ₹{row.lineTotalInr}
                        </td>
                        <td className="px-3 py-3 text-gray-600">{row.bestBuyFrom}</td>
                      </tr>
                    ))}
                    {(groceryTab === 'weekly'
                      ? dietPlan.groceryList.weekly
                      : dietPlan.groceryList.monthly
                    )?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Nothing in this list for your current plan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-xs text-emerald-100">A · This week (fresh)</p>
                    <p className="text-2xl font-bold">₹{dietPlan.groceryList.weeklyTotalInr}</p>
                    <p className="text-[11px] text-emerald-100 mt-1">Sum of weekly tab rows</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-xs text-emerald-100">B · Monthly staples (full pack)</p>
                    <p className="text-2xl font-bold">₹{dietPlan.groceryList.monthlyTotalInr}</p>
                    <p className="text-[11px] text-emerald-100 mt-1">What you pay once at the shop — NOT added in full to this week</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 ring-2 ring-white/40">
                    <p className="text-xs text-emerald-50 font-semibold">C · Est. THIS week&apos;s food cost</p>
                    <p className="text-2xl font-bold">₹{dietPlan.groceryList.estimatedWeekFoodSpendInr}</p>
                    <p className="text-[11px] text-emerald-50 mt-1">
                      {dietPlan.groceryList.spendBreakdown?.formula ||
                        `A + (B ÷ 4) = C`}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-emerald-50 leading-relaxed bg-black/10 rounded-lg p-3">
                  {dietPlan.groceryList.spendBreakdown?.plainEnglish ||
                    `₹${dietPlan.groceryList.monthlyTotalInr} monthly is the full staple bill. Only ~¼ of that (₹${Math.round(
                      (dietPlan.groceryList.monthlyTotalInr || 0) / 4
                    )}) counts toward this week, plus weekly fresh ₹${dietPlan.groceryList.weeklyTotalInr}.`}
                </p>
              </div>
              {dietPlan.groceryList.notes?.length > 0 && (
                <ul className="px-4 py-3 text-xs text-gray-500 space-y-1 bg-gray-50 border-t">
                  {dietPlan.groceryList.notes.map((n: string, i: number) => (
                    <li key={i}>• {n}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Day Selector — horizontal scroll on mobile so Sat–Sun stay readable */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            {selectedDay === todayKey && (
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm text-gray-600">
                  Tap <span className="font-semibold text-purple-700">Ate this</span> on today&apos;s meals to build your streak
                </p>
                {streak > 0 && (
                  <Badge className="bg-orange-500 text-white gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {streak}-day streak
                  </Badge>
                )}
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
              {days.map((day) => {
                const isToday = day.key === days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key;
                const isSelected = selectedDay === day.key;
                
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`relative flex-shrink-0 w-[4.5rem] sm:w-auto sm:flex-1 snap-start transition-all duration-200 ${
                      isSelected ? 'scale-[1.03]' : ''
                    }`}
                  >
                    <div className={`
                      px-2 py-3 sm:px-4 sm:py-5 rounded-xl border-2 transition-all text-center
                      ${isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-lg' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}>
                      <p className={`text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {day.label}
                      </p>
                      <p className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {day.fullName.slice(0, 3)}
                      </p>
                      {isToday && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500"></span>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Meals Section */}
        <div className="space-y-4">
          {dayPlan?.meals?.map((meal: any, mealIdx: number) => {
            const mealNameLower = (meal.name || '').toLowerCase();
            const isPreWorkout = /pre[- ]?workout/.test(mealNameLower);
            const isPostWorkout = /post[- ]?workout/.test(mealNameLower);
            return (
            <Card 
              key={mealIdx} 
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                isPreWorkout ? 'ring-2 ring-amber-400' : isPostWorkout ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <CardHeader 
                className="cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 transition-colors"
                onClick={() => setExpandedMeal(expandedMeal === mealIdx ? null : mealIdx)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`p-3 sm:p-4 rounded-xl shadow-md flex-shrink-0 ${
                      isPreWorkout
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : isPostWorkout
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <CardTitle className="text-lg sm:text-xl">{meal.name}</CardTitle>
                        {isPreWorkout && (
                          <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs">Pre-Workout</Badge>
                        )}
                        {isPostWorkout && (
                          <Badge className="bg-emerald-600 text-white text-[10px] sm:text-xs">Post-Workout</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meal.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {meal.totalCalories} cal
                        </span>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span>{meal.foods?.length} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                      disabled={swappingIdx === mealIdx}
                      onClick={(e) => openSwap(mealIdx, e)}
                    >
                      {swappingIdx === mealIdx ? 'Cooking up…' : 'Shake it up'}
                    </Button>
                    {selectedDay === todayKey && (
                      loggedMealNames.includes(meal.name) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 bg-emerald-50 h-8 text-xs"
                          onClick={(e) => undoMeal(meal.name, e)}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Ate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white h-8 text-xs"
                          disabled={checkInBusy === meal.name}
                          onClick={(e) => checkInMeal(meal, e)}
                        >
                          {checkInBusy === meal.name ? '…' : 'Ate this'}
                        </Button>
                      )
                    )}
                    <Badge variant="secondary" className="text-sm sm:text-base px-2 sm:px-3 py-1">
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

                          <div className="grid grid-cols-3 gap-3 mb-4">
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
                          </div>

                          {food.recipe && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Info className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-gray-900">How to Prepare</span>
                              </div>
                              <ul className="space-y-3">
                                {expandRecipeIfShort(food.item, food.recipe, food.quantity)
                                  .split(/\n+/)
                                  .map((line: string) => line.trim())
                                  .filter((line: string) => line.length > 2)
                                  .flatMap((line: string) => {
                                    if (/^(ingredients|method|tips)/i.test(line)) return [line];
                                    if (line.includes('. ') && !/^\d+\./.test(line) && line.length > 100) {
                                      return line.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 2);
                                    }
                                    return [line];
                                  })
                                  .map((step: string, i: number) => {
                                    const isHeader = /^(ingredients|method|tips)/i.test(step);
                                    const cleanStep = step.replace(/^[\d\-\*•]+[\.\)\s]*/, '');
                                    return (
                                      <li key={i} className={`flex gap-3 items-start ${isHeader ? 'mt-2' : ''}`}>
                                        {!isHeader && (
                                          <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                            {i + 1}
                                          </span>
                                        )}
                                        <p className={`text-sm leading-relaxed pt-1 ${isHeader ? 'font-bold text-blue-900 w-full' : 'text-gray-700'}`}>
                                          {isHeader ? step : cleanStep}
                                        </p>
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
                      <div className="grid grid-cols-3 gap-4">
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
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Costs are in the grocery list above — not per meal.
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
            );
          })}
        </div>

        {/* Weekly grocery spend pointer */}
        {dietPlan.groceryList ? (
          <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShoppingCart className="w-6 h-6" />
                Estimated week food spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold mb-2">
                  ₹{dietPlan.groceryList.estimatedWeekFoodSpendInr}
                </p>
                <p className="text-emerald-100">
                  From grocery list (fresh this week + share of monthly staples)
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}
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

      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Shake it up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Bored of this plate? We’ll spin a fresh option at similar calories — grocery list updates with it.
            </p>
            <div>
              <Label htmlFor="swapPref">What do you want instead?</Label>
              <Input
                id="swapPref"
                value={swapPref}
                onChange={(e) => setSwapPref(e.target.value)}
                placeholder="e.g. more protein, cheaper, vegetarian pasta…"
                className="mt-1.5"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['more variety', 'higher protein', 'cheaper', 'quick under 15 mins', 'more veggies'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSwapPref(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSwapDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                onClick={confirmSwap}
              >
                Surprise me
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}