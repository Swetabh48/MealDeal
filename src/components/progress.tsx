'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Calendar,
  Plus, Scale, Ruler, Award, Target, Minus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function ProgressPage() {
  const router = useRouter();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    notes: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [progressRes, profileRes] = await Promise.all([
        fetch('/api/progress'),
        fetch('/api/user/profile')
      ]);

      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgressData(data.progress || []);
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserProfile(data.user);
        setFormData(prev => ({
          ...prev,
          weight: data.user.weight?.toString() || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(),
          weight: parseFloat(formData.weight),
          notes: formData.notes,
          measurements: {
            chest: formData.measurements.chest ? parseFloat(formData.measurements.chest) : undefined,
            waist: formData.measurements.waist ? parseFloat(formData.measurements.waist) : undefined,
            hips: formData.measurements.hips ? parseFloat(formData.measurements.hips) : undefined,
            arms: formData.measurements.arms ? parseFloat(formData.measurements.arms) : undefined,
            thighs: formData.measurements.thighs ? parseFloat(formData.measurements.thighs) : undefined,
          }
        })
      });

      if (res.ok) {
        toast.success('Progress recorded successfully! 🎉');
        setIsDialogOpen(false);
        fetchData();
        setFormData({
          weight: '',
          notes: '',
          measurements: { chest: '', waist: '', hips: '', arms: '', thighs: '' }
        });
      } else {
        toast.error('Failed to record progress');
      }
    } catch (error) {
      console.error('Error recording progress:', error);
      toast.error('Something went wrong');
    }
  };

  const getWeightChange = () => {
    if (progressData.length < 2) return null;
    const latest = progressData[0].weight;
    const oldest = progressData[progressData.length - 1].weight;
    const change = latest - oldest;
    return { value: Math.abs(change).toFixed(1), isPositive: change > 0 };
  };

  const getChartData = () => {
    return progressData
      .slice()
      .reverse()
      .map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: p.weight
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const weightChange = getWeightChange();
  const chartData = getChartData();

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
                <h1 className="text-xl font-bold">Progress Tracker</h1>
                <p className="text-sm text-gray-600">Monitor your health journey</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Record Your Progress</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="weight">Weight (kg) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chest">Chest (cm)</Label>
                          <Input
                            id="chest"
                            type="number"
                            step="0.1"
                            value={formData.measurements.chest}
                            onChange={(e) => setFormData({
                              ...formData,
                              measurements: {...formData.measurements, chest: e.target.value}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="waist">Waist (cm)</Label>
                          <Input
                            id="waist"
                            type="number"
                            step="0.1"
                            value={formData.measurements.waist}
                            onChange={(e) => setFormData({
                              ...formData,
                              measurements: {...formData.measurements, waist: e.target.value}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hips">Hips (cm)</Label>
                          <Input
                            id="hips"
                            type="number"
                            step="0.1"
                            value={formData.measurements.hips}
                            onChange={(e) => setFormData({
                              ...formData,
                              measurements: {...formData.measurements, hips: e.target.value}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="arms">Arms (cm)</Label>
                          <Input
                            id="arms"
                            type="number"
                            step="0.1"
                            value={formData.measurements.arms}
                            onChange={(e) => setFormData({
                              ...formData,
                              measurements: {...formData.measurements, arms: e.target.value}
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="How are you feeling? Any observations..."
                          rows={3}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        Save Progress
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {progressData[0]?.weight || userProfile?.weight || '--'} kg
              </h3>
              <p className="text-sm text-gray-600">Current Weight</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                {weightChange?.isPositive ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-green-600" />
                )}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {weightChange?.isPositive ? '+' : weightChange ? '-' : ''}
                {weightChange?.value || '0'} kg
              </h3>
              <p className="text-sm text-gray-600">Weight Change</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {progressData.length}
              </h3>
              <p className="text-sm text-gray-600">Total Entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Weight Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Progress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No progress entries yet</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Your First Entry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {progressData.map((entry, idx) => (
                  <div key={entry._id || idx} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{entry.weight} kg</p>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {idx < progressData.length - 1 && (
                        <div className="flex items-center gap-1">
                          {entry.weight < progressData[idx + 1].weight ? (
                            <>
                              <Minus className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-600">
                                {(progressData[idx + 1].weight - entry.weight).toFixed(1)} kg
                              </span>
                            </>
                          ) : entry.weight > progressData[idx + 1].weight ? (
                            <>
                              <Plus className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-600">
                                {(entry.weight - progressData[idx + 1].weight).toFixed(1)} kg
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {entry.measurements && (Object.values(entry.measurements).some((v: any) => v)) && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                        {entry.measurements.chest && (
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-gray-600">Chest</p>
                            <p className="font-semibold">{entry.measurements.chest} cm</p>
                          </div>
                        )}
                        {entry.measurements.waist && (
                          <div className="bg-green-50 rounded p-2">
                            <p className="text-xs text-gray-600">Waist</p>
                            <p className="font-semibold">{entry.measurements.waist} cm</p>
                          </div>
                        )}
                        {entry.measurements.hips && (
                          <div className="bg-purple-50 rounded p-2">
                            <p className="text-xs text-gray-600">Hips</p>
                            <p className="font-semibold">{entry.measurements.hips} cm</p>
                          </div>
                        )}
                        {entry.measurements.arms && (
                          <div className="bg-orange-50 rounded p-2">
                            <p className="text-xs text-gray-600">Arms</p>
                            <p className="font-semibold">{entry.measurements.arms} cm</p>
                          </div>
                        )}
                        {entry.measurements.thighs && (
                          <div className="bg-pink-50 rounded p-2">
                            <p className="text-xs text-gray-600">Thighs</p>
                            <p className="font-semibold">{entry.measurements.thighs} cm</p>
                          </div>
                        )}
                      </div>
                    )}

                    {entry.notes && (
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-700">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}