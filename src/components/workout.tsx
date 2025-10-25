'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Dumbbell, CheckCircle, Clock, Flame,
  Target, Play, X, Calendar, TrendingUp, Info,
  ChevronRight, Star, Zap, Heart, Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function WorkoutPage() {
  const router = useRouter();
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<any>(null);
  const [workoutTracking, setWorkoutTracking] = useState<any>({});

  const days = [
    { key: 'monday', label: 'Mon', short: 'M' },
    { key: 'tuesday', label: 'Tue', short: 'T' },
    { key: 'wednesday', label: 'Wed', short: 'W' },
    { key: 'thursday', label: 'Thu', short: 'T' },
    { key: 'friday', label: 'Fri', short: 'F' },
    { key: 'saturday', label: 'Sat', short: 'S' },
    { key: 'sunday', label: 'Sun', short: 'S' }
  ];

  useEffect(() => {
    fetchData();
    const today = new Date().getDay();
    setSelectedDay(days[today === 0 ? 6 : today - 1].key);
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, logsRes] = await Promise.all([
        fetch('/api/workout'),
        fetch('/api/workout/log')
      ]);

      if (planRes.ok) {
        const data = await planRes.json();
        setWorkoutPlan(data.workoutPlan);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setWorkoutLogs(data.workoutLogs || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (dayWorkout: any) => {
    setCurrentWorkout({ ...dayWorkout, day: selectedDay });
    const initialTracking: any = {};
    
    dayWorkout.exercises.forEach((ex: any, idx: number) => {
      initialTracking[idx] = {
        exerciseName: ex.name,
        setsCompleted: 0,
        repsCompleted: [],
        notes: '',
        completed: false
      };
    });

    setWorkoutTracking(initialTracking);
    setTrackingDialog(true);
  };

  const updateReps = (exerciseIdx: number, setIdx: number, reps: string) => {
    setWorkoutTracking((prev: any) => {
      const updated = { ...prev };
      if (!updated[exerciseIdx].repsCompleted[setIdx]) {
        updated[exerciseIdx].repsCompleted[setIdx] = reps;
      } else {
        updated[exerciseIdx].repsCompleted[setIdx] = reps;
      }
      return updated;
    });
  };

  const completeSet = (exerciseIdx: number) => {
    setWorkoutTracking((prev: any) => {
      const updated = { ...prev };
      const currentSets = updated[exerciseIdx].setsCompleted;
      const totalSets = currentWorkout.exercises[exerciseIdx].sets;
      
      if (currentSets < totalSets) {
        updated[exerciseIdx].setsCompleted = currentSets + 1;
        
        if (currentSets + 1 === totalSets) {
          updated[exerciseIdx].completed = true;
        }
      }
      
      return updated;
    });
  };

  const saveWorkout = async () => {
    try {
      const exercises = Object.values(workoutTracking);
      const totalCalories = currentWorkout.totalCaloriesBurn || 0;

      const res = await fetch('/api/workout/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutPlanId: workoutPlan._id,
          date: new Date(),
          day: selectedDay,
          exercises,
          totalDuration: 0,
          caloriesBurned: totalCalories,
          difficulty: 'moderate',
          notes: ''
        })
      });

      if (res.ok) {
        toast.success('Workout logged successfully! 💪');
        setTrackingDialog(false);
        fetchData();
      } else {
        toast.error('Failed to log workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Dumbbell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">No Workout Plan Yet</h2>
              <p className="text-xl text-gray-600 mb-8">
                Let&apos;s create your personalized workout routine
              </p>
              <Link href="/onboarding">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600">
                  Create Workout Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dayWorkout = workoutPlan.weeklySchedule[selectedDay];
  const currentDayIndex = new Date().getDay();
  const today = days[currentDayIndex === 0 ? 6 : currentDayIndex - 1].key;
  const todayLog = workoutLogs.find(log => 
    log.day === selectedDay && 
    new Date(log.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Floating Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-orange-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-orange-100 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5 text-orange-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Workout Plan</h1>
                <p className="text-sm text-orange-600">Let&apos;s crush it today! 💪</p>
              </div>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all">
                Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Stats Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Dumbbell className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Fitness Journey</h2>
                <p className="text-orange-100 text-sm">
                  {workoutPlan.gymTiming ? `Workout Time: ${workoutPlan.gymTiming}` : 'Stay consistent!'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-yellow-300" />
                  <span className="text-xs text-orange-100">Total Burn</span>
                </div>
                <p className="text-3xl font-bold">
                  {Object.values(workoutPlan.weeklySchedule).reduce((sum: number, day: any) => 
                    sum + (day.totalCaloriesBurn || 0), 0
                  )}
                </p>
                <p className="text-xs text-orange-200">calories/week</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-xs text-orange-100">Completed</span>
                </div>
                <p className="text-3xl font-bold">{workoutLogs.length}/7</p>
                <p className="text-xs text-orange-200">workouts</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-300" />
                  <span className="text-xs text-orange-100">Streak</span>
                </div>
                <p className="text-3xl font-bold">{Math.min(workoutLogs.length, 7)}</p>
                <p className="text-xs text-orange-200">days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Week Calendar */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-orange-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Weekly Schedule
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const isToday = day.key === today;
              const isSelected = day.key === selectedDay;
              const dayPlan = workoutPlan.weeklySchedule[day.key];
              
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  className={`relative p-4 rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-105'
                      : dayPlan.restDay
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                  <div className={`text-xs font-medium mb-1 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                    {day.label}
                  </div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                    {dayPlan.restDay ? '🧘' : '💪'}
                  </div>
                  <div className={`text-xs mt-1 ${isSelected ? 'text-orange-100' : 'text-gray-600'}`}>
                    {dayPlan.restDay ? 'Rest' : dayPlan.workoutType.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workout Content */}
        {dayWorkout.restDay ? (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 text-white text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Heart className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Rest & Recovery Day</h2>
            <p className="text-xl text-green-100 mb-6 max-w-2xl mx-auto">
              {workoutPlan.restAndRecovery || 'Your muscles grow during rest. Take it easy today and let your body recover stronger!'}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-sm text-green-200 mb-1">Recommended</p>
                <p className="font-semibold">Light stretching or yoga</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <p className="text-sm text-green-200 mb-1">Duration</p>
                <p className="font-semibold">15-20 minutes</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Workout Header */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
                    <Dumbbell className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{dayWorkout.workoutType}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {dayWorkout.duration}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {dayWorkout.totalCaloriesBurn} cal
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Target className="w-4 h-4 text-blue-500" />
                        {dayWorkout.exercises?.length || 0} exercises
                      </span>
                    </div>
                  </div>
                </div>
                {!todayLog ? (
                  <button 
                    onClick={() => startWorkout(dayWorkout)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Workout
                  </button>
                ) : (
                  <Badge className="bg-green-500 text-white px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed Today
                  </Badge>
                )}
              </div>

              {/* Warmup & Cooldown Quick View */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Warm-up</span>
                  </div>
                  <p className="text-sm text-yellow-800">{dayWorkout.warmup}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Cool-down</span>
                  </div>
                  <p className="text-sm text-blue-800">{dayWorkout.cooldown}</p>
                </div>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
              {dayWorkout.exercises?.map((exercise: any, idx: number) => (
                <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-orange-100 transition-all hover:shadow-2xl">
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{exercise.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
                            <Target className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-700">{exercise.sets} × {exercise.reps}</span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{exercise.restBetweenSets} rest</span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full">
                            <Flame className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">{exercise.caloriesBurn} cal</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-gray-400 transition-transform ${expandedExercise === idx ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {expandedExercise === idx && (
                    <div className="px-6 pb-6 space-y-4">
                      {/* Target Muscles */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Target Muscles
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exercise.targetMuscles?.map((muscle: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-purple-700 shadow-sm">
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          How to Perform
                        </h4>
                        <p className="text-blue-800 leading-relaxed whitespace-pre-line">{exercise.instructions}</p>
                      </div>

                      {/* Equipment & Benefits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                          <h4 className="font-semibold text-amber-900 mb-2 text-sm">Equipment</h4>
                          <p className="text-amber-800">{exercise.equipment}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-2 text-sm">Benefits</h4>
                          <p className="text-green-800 text-sm">{exercise.benefits}</p>
                        </div>
                      </div>

                      {/* Safety Tips */}
                      {exercise.safetyTips && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2 border-red-200">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Safety Tips
                          </h4>
                          <p className="text-red-800">{exercise.safetyTips}</p>
                        </div>
                      )}

                      {/* Modifications */}
                      {exercise.modifications && (
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200">
                          <h4 className="font-semibold text-indigo-900 mb-2">🔄 Easier Variation</h4>
                          <p className="text-indigo-800">{exercise.modifications}</p>
                        </div>
                      )}

                      {/* Video Reference */}
                      {exercise.videoReference && (
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.videoReference)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200 hover:border-orange-300 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-gray-900">Watch Tutorial</p>
                                <p className="text-sm text-gray-600">Learn proper form & technique</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Meal Timing Note */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl flex-shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">📅 Your Meal Plan Integration</h3>
              <p className="text-blue-100 leading-relaxed">
                Your pre and post-workout meals are already included in your daily meal plan! 
                Check your <span className="font-semibold text-white">Meal Plan</span> page to see meals timed perfectly around your workout schedule.
              </p>
              <Link href="/meal-plan">
                <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-full text-sm font-medium hover:shadow-lg transition-all">
                  View Meal Plan →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Guidelines & Warnings */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Guidelines */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Quick Tips</h3>
            </div>
            <div className="space-y-3">
              {workoutPlan.guidelines?.map((tip: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                  <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {workoutPlan.warnings && workoutPlan.warnings.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-6 shadow-xl border-2 border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Info className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-900">Important Notes</h3>
              </div>
              <div className="space-y-3">
                {workoutPlan.warnings.map((warning: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievement Banner */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl p-8 text-white text-center shadow-2xl">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">You&apos;re Doing Amazing! 🎉</h3>
          <p className="text-purple-100 mb-4">Every workout brings you closer to your goals</p>
          <Link href="/progress">
            <button className="px-6 py-3 bg-white text-purple-600 rounded-full font-medium hover:shadow-xl transition-all">
              View My Progress
            </button>
          </Link>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingDialog && currentWorkout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="text-2xl font-bold">Track Your Workout</h3>
                  <p className="text-orange-100 text-sm mt-1">Log your sets and reps</p>
                </div>
                <button 
                  onClick={() => setTrackingDialog(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {currentWorkout.exercises?.map((exercise: any, idx: number) => {
                const tracking = workoutTracking[idx];
                const progress = tracking ? (tracking.setsCompleted / exercise.sets) * 100 : 0;

                return (
                  <div key={idx} className={`p-5 bg-gradient-to-br rounded-2xl border-2 shadow-sm hover:shadow-md transition-shadow ${
                    tracking?.completed 
                      ? 'from-green-50 to-emerald-50 border-green-300' 
                      : 'from-orange-50 to-red-50 border-orange-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{exercise.name}</h4>
                        <p className="text-sm text-gray-600">{exercise.sets} sets × {exercise.reps} reps</p>
                      </div>
                      {tracking?.completed && (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      )}
                    </div>

                    <Progress value={progress} className="h-2 mb-4" />
                    
                    <div className="space-y-2 mb-3">
                      {[...Array(exercise.sets)].map((_: any, setIdx: number) => (
                        <div key={setIdx} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 w-16">Set {setIdx + 1}:</span>
                          <input
                            type="text"
                            placeholder={exercise.reps}
                            value={tracking?.repsCompleted[setIdx] || ''}
                            onChange={(e) => updateReps(idx, setIdx, e.target.value)}
                            disabled={tracking?.completed}
                            className="flex-1 px-4 py-2 border-2 border-orange-300 rounded-xl text-center font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100"
                          />
                          <span className="text-sm text-gray-600">reps</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => completeSet(idx)}
                      disabled={tracking?.completed}
                      className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        tracking?.completed
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      {tracking?.completed ? 'Completed' : `Complete Set ${(tracking?.setsCompleted || 0) + 1}`}
                    </button>
                  </div>
                );
              })}
              
              <div className="sticky bottom-0 pt-4 bg-white">
                <button 
                  onClick={saveWorkout}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  Finish & Save Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}