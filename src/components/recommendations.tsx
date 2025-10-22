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
  CheckCircle, Info, Zap, TrendingUp, Clock,
  Users, Apple,
  Calendar
} from 'lucide-react';

export default function RecommendationsPage() {
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

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

  const parseRecommendation = (rec: string) => {
    // Remove all asterisks and clean up formatting
    const cleaned = rec.replace(/\*\*/g, '').trim();
    
    // Check if it has a title format (text before colon)
    const colonIndex = cleaned.indexOf(':');
    if (colonIndex > 0 && colonIndex < 50) {
      const title = cleaned.substring(0, colonIndex).trim();
      const content = cleaned.substring(colonIndex + 1).trim();
      return { title, content, hasTitle: true };
    }
    
    // Otherwise treat as simple recommendation
    return { title: '', content: cleaned, hasTitle: false };
  };

  const getTipIcon = (index: number) => {
    const icons = [Heart, Apple, Activity, Droplets, Zap, TrendingUp, Clock, Users];
    const Icon = icons[index % icons.length];
    return <Icon className="w-5 h-5" />;
  };

  const getTipColor = (index: number) => {
    const colors = [
      { bg: 'from-red-500 to-pink-500', text: 'text-red-600', light: 'bg-red-50' },
      { bg: 'from-green-500 to-emerald-500', text: 'text-green-600', light: 'bg-green-50' },
      { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-600', light: 'bg-blue-50' },
      { bg: 'from-purple-500 to-indigo-500', text: 'text-purple-600', light: 'bg-purple-50' },
      { bg: 'from-orange-500 to-amber-500', text: 'text-orange-600', light: 'bg-orange-50' },
      { bg: 'from-teal-500 to-cyan-500', text: 'text-teal-600', light: 'bg-teal-50' },
      { bg: 'from-rose-500 to-pink-500', text: 'text-rose-600', light: 'bg-rose-50' },
      { bg: 'from-indigo-500 to-blue-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
    ];
    return colors[index % colors.length];
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
                <h1 className="text-xl font-bold">Health Tips</h1>
                <p className="text-sm text-gray-600">Quick, actionable advice</p>
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
              Water
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
                      Quick wins to boost your health journey. Tap any tip to learn more!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Tip Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {dietPlan.recommendations?.map((rec: string, idx: number) => {
                const parsed = parseRecommendation(rec);
                const colors = getTipColor(idx);
                const isExpanded = expandedTip === idx;

                return (
                  <Card 
                    key={idx} 
                    className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => setExpandedTip(isExpanded ? null : idx)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`bg-gradient-to-r ${colors.bg} p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <div className="text-white">
                            {getTipIcon(idx)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {parsed.hasTitle ? (
                            <>
                              <h3 className="font-bold text-lg mb-2 text-gray-900">
                                {parsed.title}
                              </h3>
                              <p className={`text-gray-700 leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
                                {parsed.content}
                              </p>
                            </>
                          ) : (
                            <p className={`text-gray-800 leading-relaxed ${!isExpanded && 'line-clamp-3'}`}>
                              {parsed.content}
                            </p>
                          )}
                          {parsed.content.length > 100 && (
                            <button className={`text-sm font-medium mt-2 ${colors.text} hover:underline`}>
                              {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>
                        <CheckCircle className={`w-5 h-5 ${colors.text} flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress Tracking Card */}
            {dietPlan.progressTracking && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Track Your Progress</h3>
                      <p className="text-green-100 text-sm">How to measure your success</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {dietPlan.progressTracking
                      .replace(/\*\*/g, '')
                      .split(/\n+/)
                      .filter((line: string) => line.trim().length > 0)
                      .map((line: string, idx: number) => {
                        const cleaned = line.trim();
                        // Check if it's a bullet point or numbered item
                        const isBullet = cleaned.match(/^[\d\-\*•\.]+\s+/);
                        const content = cleaned.replace(/^[\d\-\*•\.]+\s+/, '');
                        
                        return (
                          <div key={idx} className="flex items-start gap-3 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
                            <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-gray-700 leading-relaxed pt-1">{content}</p>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Medical Notes */}
            {dietPlan.cautionaryNotes && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Important Medical Notes</h3>
                      <p className="text-orange-100 text-sm">Please read carefully</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {dietPlan.cautionaryNotes
                      .replace(/\*\*/g, '')
                      .split(/\n+/)
                      .filter((line: string) => line.trim().length > 0)
                      .map((line: string, idx: number) => {
                        const cleaned = line.trim().replace(/^[\d\-\*•\.]+\s+/, '');
                        
                        return (
                          <div key={idx} className="flex items-start gap-3 bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700 leading-relaxed">{cleaned}</p>
                          </div>
                        );
                      })}
                  </div>
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
                      Water is essential for metabolism, energy, and overall health
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {dietPlan.hydration.replace(/\*\*/g, '')}
                  </p>
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <Info className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-bold text-lg mb-3 text-gray-900">Why It Matters</h3>
                    <ul className="space-y-2 text-gray-700">
                      {['Boosts metabolism', 'Improves digestion', 'Enhances performance', 'Maintains energy'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-6">
                    <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-bold text-lg mb-3 text-gray-900">Pro Tips</h3>
                    <ul className="space-y-2 text-gray-700">
                      {['Drink water upon waking', 'Carry a water bottle', 'Set hourly reminders', 'Add fruit for flavor'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
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
                    <h2 className="text-2xl font-bold mb-2">Get Moving</h2>
                    <p className="text-orange-100">
                      Exercise recommendations for optimal results
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {dietPlan.exerciseRecommendations ? (
              <>
                <Card className="border-0 shadow-lg">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                    <div className="flex items-center gap-3 text-white">
                      <div className="bg-white/20 p-3 rounded-lg">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Your Exercise Routine</h3>
                        <p className="text-orange-100 text-sm">Follow these guidelines for best results</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {parseExerciseText(dietPlan.exerciseRecommendations).map((text: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-all">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                            {idx + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed pt-1 flex-1">{text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { 
                      icon: Heart, 
                      title: 'Cardio', 
                      duration: '30-45 minutes',
                      frequency: '4-5 times per week',
                      examples: ['Brisk walking', 'Jogging', 'Cycling', 'Swimming'],
                      benefit: 'Burns calories & improves heart health',
                      gradient: 'from-red-500 to-pink-500',
                      bg: 'from-red-50 to-pink-50',
                      border: 'border-red-200'
                    },
                    { 
                      icon: Dumbbell, 
                      title: 'Strength', 
                      duration: '45-60 minutes',
                      frequency: '3-4 times per week',
                      examples: ['Push-ups', 'Squats', 'Weight lifting', 'Resistance bands'],
                      benefit: 'Builds muscle & boosts metabolism',
                      gradient: 'from-blue-500 to-cyan-500',
                      bg: 'from-blue-50 to-cyan-50',
                      border: 'border-blue-200'
                    },
                    { 
                      icon: Activity, 
                      title: 'Flexibility', 
                      duration: '15-30 minutes',
                      frequency: 'Daily',
                      examples: ['Yoga', 'Stretching', 'Pilates', 'Tai Chi'],
                      benefit: 'Improves mobility & prevents injury',
                      gradient: 'from-green-500 to-emerald-500',
                      bg: 'from-green-50 to-emerald-50',
                      border: 'border-green-200'
                    }
                  ].map((item, i) => (
                    <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                      <div className={`bg-gradient-to-r ${item.gradient} p-6 text-white`}>
                        <div className="bg-white/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                          <item.icon className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-xl text-center">{item.title}</h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className={`bg-gradient-to-r ${item.bg} rounded-lg p-3 border ${item.border}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-semibold text-gray-700">{item.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-semibold text-gray-700">{item.frequency}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Examples</p>
                            <ul className="space-y-1">
                              {item.examples.map((example, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  <span>{example}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-3 border-t">
                            <p className="text-sm text-gray-600 italic">
                              💡 {item.benefit}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-500 p-3 rounded-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-purple-900 mb-3">Exercise Pro Tips</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {[
                            'Start slow and gradually increase intensity',
                            'Stay hydrated before, during, and after exercise',
                            'Always warm up before and cool down after',
                            'Listen to your body and rest when needed',
                            'Mix different types of exercises for best results',
                            'Consistency is more important than intensity'
                          ].map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-white rounded-lg p-3">
                              <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Activity className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Exercise Plan Coming Soon
                  </h3>
                  <p className="text-gray-500">
                    We&apos;re working on your personalized exercise recommendations
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
                    <h2 className="text-2xl font-bold mb-2">Supplement Guide</h2>
                    <p className="text-purple-100">
                      Optional support for your health goals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {dietPlan.supplements && dietPlan.supplements.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {dietPlan.supplements.map((supplement: any, idx: number) => {
                  const colors = getTipColor(idx);
                  return (
                    <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`bg-gradient-to-r ${colors.bg} p-4 rounded-xl flex-shrink-0`}>
                            <Pill className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-3 text-gray-900">{supplement.name}</h3>
                            <div className="space-y-2">
                              <div className={`${colors.light} rounded-lg p-3`}>
                                <p className="text-sm font-medium text-gray-600 mb-1">Dosage</p>
                                <p className="text-gray-800">{supplement.dosage}</p>
                              </div>
                              <div className={`${colors.light} rounded-lg p-3`}>
                                <p className="text-sm font-medium text-gray-600 mb-1">When to take</p>
                                <p className="text-gray-800">{supplement.timing}</p>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900 mb-1">Why you need this</p>
                                <p className="text-gray-700 text-sm">{supplement.reason}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No specific supplements recommended</p>
                  <p className="text-sm text-gray-500">A balanced diet provides all necessary nutrients</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">Important</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Always consult your healthcare provider before starting any supplements, 
                      especially if you have medical conditions or take medications.
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
const parseExerciseText = (text: string) => {
  if (!text) return [];

  // 1) Basic cleanup
  let cleaned = text.replace(/\*\*/g, '').trim();

  // 2) Normalize common bullet characters to a simple hyphen
  cleaned = cleaned.replace(/•|\u2022|·/g, '-');

  // 3) Remove stray newlines so we can re-insert controlled splits
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');

  // 4) Insert a newline before numbered list markers like "1.", "1)", "1:"
  //    This helps splitting when the server returns "1. A... 2. B... 3. C..."
  cleaned = cleaned.replace(/(\d+[\)\.\:])\s+/g, '\n$1 ');

  // 5) Also insert newline before hyphen bullets like " - " or at start "- "
  cleaned = cleaned.replace(/\s-\s+/g, '\n- ');

  // 6) Split on the newlines we just inserted
  let parts = cleaned
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    // remove leading numbering / bullet markers (e.g. "1. ", "1) ", "- ")
    .map(p => p.replace(/^[\-\d\)\.\:]+\s*/, '').trim());

  // 7) If we still have a single long paragraph, attempt to split by sentence boundaries
  //    This is a fallback for inputs that are plain text sentences.
  if (parts.length === 1) {
    const maybeSentences = parts[0]
      .split(/(?<=\.)\s+(?=[A-Z0-9])/)
      .map(s => s.trim())
      .filter(Boolean);
    if (maybeSentences.length > 1) parts = maybeSentences;
  }

  return parts;
};
