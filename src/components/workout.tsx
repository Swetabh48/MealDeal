'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Dumbbell, CheckCircle, Clock, Flame,
  Target, Play, X, Calendar, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, Info, Video
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
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!workoutPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
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
  const todayLog = workoutLogs.find(log => 
    log.day === selectedDay && 
    new Date(log.date).toDateString() === new Date().toDateString()
  );

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
                <h1 className="text-xl font-bold">My Workout Plan</h1>
                <p className="text-sm text-gray-600">AI-powered fitness routine</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Card */}
        <Card className="mb-6 border-0 shadow-xl bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Fitness Journey</h2>
                <p className="text-orange-100">
                  {workoutPlan.gymTiming && `Workout Time: ${workoutPlan.gymTiming}`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm text-orange-100">Streak</p>
                  <p className="text-xl font-bold">{Math.min(workoutLogs.length, 7)} days</p>
                </div>
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
                const dayPlan = workoutPlan.weeklySchedule[day.key];
                
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-br from-orange-500 to-red-600 border-transparent text-white shadow-lg' 
                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-2 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                      {day.label}
                    </p>
                    <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {dayPlan.restDay ? 'Rest' : dayPlan.workoutType}
                    </div>
                    {isToday && (
                      <div className="absolute top-2 right-2">
                        <span className="flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Workout Details */}
        {dayWorkout.restDay ? (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-12 text-center">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Rest & Recovery Day</h2>
              <p className="text-green-100 mb-6">
                {workoutPlan.restAndRecovery}
              </p>
              <div className="bg-white/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-green-100">💡 Pro Tip</p>
                <p className="text-white font-medium mt-1">
                  Use this day for light stretching, walking, or yoga to promote recovery
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Today's Workout Card */}
            <Card className="mb-6 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-6 h-6 text-orange-600" />
                    {dayWorkout.workoutType} - {dayWorkout.duration}
                  </CardTitle>
                  {!todayLog ? (
                    <Button
                      onClick={() => startWorkout(dayWorkout)}
                      className="bg-gradient-to-r from-orange-600 to-red-600"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  ) : (
                    <Badge className="bg-green-500 text-white px-4 py-2">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed Today
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Pre/Post Workout Meals */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pre-Workout Meal
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      ⏰ {dayWorkout.preWorkoutMeal.timing}
                    </p>
                    <ul className="space-y-1">
                      {dayWorkout.preWorkoutMeal.foods.map((food: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-800">• {food}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-blue-600 mt-2 italic">
                      {dayWorkout.preWorkoutMeal.reason}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Post-Workout Meal
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      ⏰ {dayWorkout.postWorkoutMeal.timing}
                    </p>
                    <ul className="space-y-1">
                      {dayWorkout.postWorkoutMeal.foods.map((food: string, idx: number) => (
                        <li key={idx} className="text-sm text-green-800">• {food}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-green-600 mt-2 italic">
                      {dayWorkout.postWorkoutMeal.reason}
                    </p>
                  </div>
                </div>

                {/* Warmup */}
                <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                  <h3 className="font-bold text-yellow-900 mb-2">🔥 Warm-up (5-10 minutes)</h3>
                  <p className="text-sm text-yellow-800">{dayWorkout.warmup}</p>
                </div>

                {/* Exercises */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Exercises ({dayWorkout.exercises.length})</h3>
                  {dayWorkout.exercises.map((exercise: any, idx: number) => (
                    <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader 
                        className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{exercise.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  {exercise.sets} sets × {exercise.reps}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame className="w-4 h-4" />
                                  {exercise.caloriesBurn} cal
                                </span>
                                <Badge variant="secondary">{exercise.type}</Badge>
                              </div>
                            </div>
                          </div>
                          {expandedExercise === idx ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </CardHeader>

                      {expandedExercise === idx && (
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Target Muscles */}
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="font-semibold text-purple-900 mb-2">💪 Target Muscles</p>
                              <div className="flex flex-wrap gap-2">
                                {exercise.targetMuscles.map((muscle: string, i: number) => (
                                  <Badge key={i} className="bg-purple-200 text-purple-900">
                                    {muscle}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Equipment */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="font-semibold text-blue-900 mb-1">🏋️ Equipment</p>
                              <p className="text-blue-800">{exercise.equipment}</p>
                            </div>

                            {/* Instructions */}
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="font-semibold text-green-900 mb-2">📝 How to Perform</p>
                              <p className="text-green-800 whitespace-pre-line leading-relaxed">
                                {exercise.instructions}
                              </p>
                            </div>

                            {/* Rest */}
                            <div className="bg-orange-50 rounded-lg p-4">
                              <p className="font-semibold text-orange-900 mb-1">⏱️ Rest Between Sets</p>
                              <p className="text-orange-800">{exercise.restBetweenSets}</p>
                            </div>

                            {/* Benefits */}
                            {exercise.benefits && (
                              <div className="bg-emerald-50 rounded-lg p-4">
                                <p className="font-semibold text-emerald-900 mb-1">✨ Benefits</p>
                                <p className="text-emerald-800">{exercise.benefits}</p>
                              </div>
                            )}

                            {/* Safety Tips */}
                            {exercise.safetyTips && (
                              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                <p className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Safety Tips
                                </p>
                                <p className="text-red-800">{exercise.safetyTips}</p>
                              </div>
                            )}

                            {/* Modifications */}
                            {exercise.modifications && (
                              <div className="bg-indigo-50 rounded-lg p-4">
                                <p className="font-semibold text-indigo-900 mb-1">🔄 Easier Variation</p>
                                <p className="text-indigo-800">{exercise.modifications}</p>
                              </div>
                            )}

                            {/* Video Reference */}
                            {exercise.videoReference && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <Video className="w-4 h-4" />
                                  Video Tutorial
                                </p>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.videoReference)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  Search: &quot;{exercise.videoReference}&quot; on YouTube
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Cooldown */}
                <div className="bg-purple-50 rounded-lg p-4 mt-4 border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-2">❄️ Cool-down & Stretching</h3>
                  <p className="text-sm text-purple-800">{dayWorkout.cooldown}</p>
                </div>

                {/* Stats */}
                <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total Calories</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dayWorkout.totalCaloriesBurn}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dayWorkout.duration}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Guidelines & Warnings */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {workoutPlan.guidelines?.map((guideline: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {workoutPlan.warnings && workoutPlan.warnings.length > 0 && (
            <Card className="border-0 shadow-lg bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Important Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {workoutPlan.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Workout Tracking Dialog */}
      <Dialog open={trackingDialog} onOpenChange={setTrackingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Track Your Workout</DialogTitle>
          </DialogHeader>

          {currentWorkout && (
            <div className="space-y-4">
              {currentWorkout.exercises.map((exercise: any, idx: number) => {
                const tracking = workoutTracking[idx];
                const progress = tracking ? (tracking.setsCompleted / exercise.sets) * 100 : 0;

                return (
                  <Card key={idx} className={`border-2 ${tracking?.completed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{exercise.name}</h4>
                          <p className="text-sm text-gray-600">
                            {exercise.sets} sets × {exercise.reps} | Rest: {exercise.restBetweenSets}
                          </p>
                        </div>
                        {tracking?.completed && (
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        )}
                      </div>

                      <Progress value={progress} className="h-2 mb-3" />

                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {[...Array(exercise.sets)].map((_, setIdx) => (
                          <div key={setIdx} className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Set {setIdx + 1}</p>
                            <Input
                              type="text"
                              placeholder={exercise.reps}
                              value={tracking?.repsCompleted[setIdx] || ''}
                              onChange={(e) => updateReps(idx, setIdx, e.target.value)}
                              className="h-8 text-center text-sm"
                              disabled={tracking?.completed}
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => completeSet(idx)}
                        disabled={tracking?.completed}
                        className="w-full"
                        variant={tracking?.completed ? "secondary" : "default"}
                      >
                        {tracking?.completed ? 'Completed' : `Complete Set ${(tracking?.setsCompleted || 0) + 1}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTrackingDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                  onClick={saveWorkout}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Workout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}