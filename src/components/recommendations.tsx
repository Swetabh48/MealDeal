'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Sparkles, Droplets, Dumbbell, 
  Activity, AlertCircle, Pill, Heart, Target,
  CheckCircle, Info
} from 'lucide-react';

export default function RecommendationsPage() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDietPlan();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No recommendations available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold">Health Recommendations</h1>
                <p className="text-sm text-gray-600">Personalized tips for success</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="recommendations">
              <Sparkles className="w-4 h-4 mr-2" />
              Tips
            </TabsTrigger>
            <TabsTrigger value="hydration">
              <Droplets className="w-4 h-4 mr-2" />
              Hydration
            </TabsTrigger>
            <TabsTrigger value="exercise">
              <Dumbbell className="w-4 h-4 mr-2" />
              Exercise
            </TabsTrigger>
            <TabsTrigger value="supplements">
              <Pill className="w-4 h-4 mr-2" />
              Supplements
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Target className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Personalized Tips</h2>
                    <p className="text-blue-100">
                      Follow these expert recommendations to achieve your health goals faster and more effectively.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {dietPlan.recommendations?.map((rec: string, idx: number) => (
                <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 leading-relaxed text-lg">{rec}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Progress Tracking Card */}
            {dietPlan.progressTracking && (
              <Card className="border-0 shadow-lg bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Activity className="w-5 h-5" />
                    How to Track Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {dietPlan.progressTracking}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Cautionary Notes */}
            {dietPlan.cautionaryNotes && (
              <Card className="border-0 shadow-lg bg-orange-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <AlertCircle className="w-5 h-5" />
                    Important Medical Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {dietPlan.cautionaryNotes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hydration Tab */}
          <TabsContent value="hydration" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Droplets className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Stay Hydrated</h2>
                    <p className="text-cyan-100">
                      Proper hydration is crucial for your metabolism, digestion, and overall health.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {dietPlan.hydration}
                  </p>
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <Info className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Why Hydration Matters</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Boosts metabolism and aids weight management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Improves digestion and nutrient absorption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Enhances physical performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Maintains energy levels throughout the day</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Pro Tips</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Drink a glass of water first thing in the morning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Carry a water bottle wherever you go</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Set reminders to drink water regularly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Infuse water with fruits for added flavor</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercise Tab */}
          <TabsContent value="exercise" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-400 to-red-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Dumbbell className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Exercise Recommendations</h2>
                    <p className="text-orange-100">
                      Combine your nutrition plan with these exercises for optimal results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {dietPlan.exerciseRecommendations ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line mb-8">
                    {dietPlan.exerciseRecommendations}
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-red-50 rounded-lg p-6 text-center">
                      <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Cardio</h3>
                      <p className="text-gray-600 text-sm">
                        30-45 minutes of brisk walking, jogging, or cycling 4-5 times per week
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Dumbbell className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Strength</h3>
                      <p className="text-gray-600 text-sm">
                        Bodyweight or weight training 3-4 times per week for muscle building
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 text-center">
                      <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Flexibility</h3>
                      <p className="text-gray-600 text-sm">
                        Yoga or stretching daily for improved mobility and recovery
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Exercise recommendations will be added to your plan soon
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-400 to-pink-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Pill className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Supplement Recommendations</h2>
                    <p className="text-purple-100">
                      These supplements may help support your health goals (consult your doctor first).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {dietPlan.supplements && dietPlan.supplements.length > 0 ? (
              <div className="grid gap-4">
                {dietPlan.supplements.map((supplement: any, idx: number) => (
                  <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg flex-shrink-0">
                          <Pill className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 text-gray-900">{supplement.name}</h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Badge variant="secondary">Dosage</Badge>
                              <p className="text-gray-700">{supplement.dosage}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Badge variant="secondary">Timing</Badge>
                              <p className="text-gray-700">{supplement.timing}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-blue-900 mb-1">Why you need this:</p>
                              <p className="text-gray-700">{supplement.reason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No specific supplements recommended for your current plan
                  </p>
                  <p className="text-sm text-gray-500">
                    A balanced diet usually provides all necessary nutrients
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">Important Note</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Always consult with your healthcare provider before starting any new supplements, 
                      especially if you have existing medical conditions or are taking medications. 
                      Supplements should complement, not replace, a balanced diet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}