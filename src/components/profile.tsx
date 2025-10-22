'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, User, Mail, Activity, Target, 
  MapPin, Save, Edit2, X, Heart,
  Calendar, Scale, Ruler, TrendingUp, Plus, Trash2, Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        setFormData(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        setEditing(false);
        toast.success('Profile updated successfully! 🎉');
        
        // Check if critical health data was changed
        const criticalFieldsChanged = 
          formData.goal !== userProfile.goal ||
          formData.weight !== userProfile.weight ||
          formData.height !== userProfile.height ||
          formData.activityLevel !== userProfile.activityLevel ||
          JSON.stringify(formData.dietaryRestrictions) !== JSON.stringify(userProfile.dietaryRestrictions) ||
          JSON.stringify(formData.medicalConditions) !== JSON.stringify(userProfile.medicalConditions) ||
          formData.budget !== userProfile.budget ||
          formData.additionalInfo?.goalDescription !== userProfile.additionalInfo?.goalDescription ||
          formData.additionalInfo?.challenges !== userProfile.additionalInfo?.challenges;

        if (criticalFieldsChanged) {
          // Show regeneration prompt
          const shouldRegenerate = window.confirm(
            '🔄 Your health profile has changed significantly!\n\n' +
            'Would you like to regenerate your diet plan based on your updated information?\n\n' +
            'This will create a new personalized meal plan matching your current goals and preferences.'
          );

          if (shouldRegenerate) {
            await regenerateDietPlan();
          }
        }
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const regenerateDietPlan = async () => {
    toast.loading('Regenerating your personalized diet plan...', { id: 'regenerating' });
    
    try {
      const response = await fetch('/api/diet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalDescription: formData.additionalInfo?.goalDescription,
          challenges: formData.additionalInfo?.challenges,
          expectations: formData.additionalInfo?.expectations,
        }),
      });

      if (response.ok) {
        toast.success('Your new diet plan is ready! 🎉', { id: 'regenerating' });
        
        // Show success message with option to view
        setTimeout(() => {
          const viewPlan = window.confirm(
            '✅ Your personalized diet plan has been updated!\n\n' +
            'Would you like to view your new meal plan now?'
          );
          
          if (viewPlan) {
            router.push('/meal-plan');
          }
        }, 500);
      } else {
        const errorData = await response.json();
        toast.error(errorData.details || 'Failed to regenerate diet plan', { id: 'regenerating' });
      }
    } catch (error) {
      console.error('Error regenerating diet plan:', error);
      toast.error('Failed to regenerate diet plan. Please try again.', { id: 'regenerating' });
    }
  };

  const handleCancel = () => {
    setFormData(userProfile);
    setEditing(false);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value }
    }));
  };

  const addArrayItem = (field: 'dietaryRestrictions' | 'medicalConditions', value: string) => {
    if (value.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'dietaryRestrictions' | 'medicalConditions', index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const bmi = userProfile?.height && userProfile?.weight 
    ? (userProfile.weight / (userProfile.height / 100) ** 2).toFixed(1)
    : null;

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
                <h1 className="text-xl font-bold">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your information</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <User className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{userProfile?.name}</h2>
                  <p className="text-blue-100 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {userProfile?.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!editing && (
                  <>
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-white text-purple-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={regenerateDietPlan}
                      variant="outline"
                      className="bg-white/20 text-white border-white/40 hover:bg-white/30"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Regenerate Plan
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        {!editing && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-cyan-50 to-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Smart Plan Updates</h3>
                  <p className="text-sm text-gray-700">
                    When you update your goals, weight, dietary restrictions, or medical conditions, 
                    we&apos;ll automatically offer to regenerate your diet plan. You can also regenerate 
                    it anytime using the button above! 🔄
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Info */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editing ? formData.name : userProfile?.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userProfile?.email}
                  disabled
                  className="mt-2 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={editing ? formData.age : userProfile?.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={editing ? formData.gender : userProfile?.gender}
                  onValueChange={(value) => updateFormData('gender', value)}
                  disabled={!editing}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="height" className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={editing ? formData.height : userProfile?.height}
                  onChange={(e) => updateFormData('height', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={editing ? formData.weight : userProfile?.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Activity Level
                </Label>
                <Select
                  value={editing ? formData.activityLevel : userProfile?.activityLevel}
                  onValueChange={(value) => updateFormData('activityLevel', value)}
                  disabled={!editing}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Lightly Active</SelectItem>
                    <SelectItem value="moderate">Moderately Active</SelectItem>
                    <SelectItem value="active">Very Active</SelectItem>
                    <SelectItem value="very_active">Extremely Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {bmi && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Body Mass Index (BMI)</p>
                    <p className="text-2xl font-bold text-green-600">{bmi}</p>
                  </div>
                  <Heart className="w-8 h-8 text-green-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals & Preferences */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-600" />
              Health Goals & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Primary Goal</Label>
              <Select
                value={editing ? formData.goal : userProfile?.goal}
                onValueChange={(value) => updateFormData('goal', value)}
                disabled={!editing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Lose Weight</SelectItem>
                  <SelectItem value="weight_gain">Gain Weight</SelectItem>
                  <SelectItem value="muscle_gain">Build Muscle</SelectItem>
                  <SelectItem value="maintenance">Maintain Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editing && (
              <>
                <div>
                  <Label htmlFor="goalDescription">Goal Description</Label>
                  <Textarea
                    id="goalDescription"
                    value={formData.additionalInfo?.goalDescription || ''}
                    onChange={(e) => updateNestedFormData('additionalInfo', 'goalDescription', e.target.value)}
                    placeholder="Describe your health goals in detail..."
                    className="mt-2 min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="challenges">Challenges You Face</Label>
                  <Textarea
                    id="challenges"
                    value={formData.additionalInfo?.challenges || ''}
                    onChange={(e) => updateNestedFormData('additionalInfo', 'challenges', e.target.value)}
                    placeholder="What makes it difficult for you to reach your goals?"
                    className="mt-2 min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="expectations">Your Expectations</Label>
                  <Textarea
                    id="expectations"
                    value={formData.additionalInfo?.expectations || ''}
                    onChange={(e) => updateNestedFormData('additionalInfo', 'expectations', e.target.value)}
                    placeholder="What do you expect from your nutrition plan?"
                    className="mt-2 min-h-24"
                  />
                </div>
              </>
            )}

            {!editing && userProfile?.additionalInfo && (
              <>
                {userProfile.additionalInfo.goalDescription && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Goal Description</p>
                    <p className="text-gray-700">{userProfile.additionalInfo.goalDescription}</p>
                  </div>
                )}
                {userProfile.additionalInfo.challenges && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-orange-900 mb-1">Challenges</p>
                    <p className="text-gray-700">{userProfile.additionalInfo.challenges}</p>
                  </div>
                )}
                {userProfile.additionalInfo.expectations && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900 mb-1">Expectations</p>
                    <p className="text-gray-700">{userProfile.additionalInfo.expectations}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dietary Restrictions */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Dietary Restrictions</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.dietaryRestrictions?.map((restriction: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-2 text-sm">
                      {restriction}
                      <button
                        onClick={() => removeArrayItem('dietaryRestrictions', idx)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add restriction (e.g., Vegetarian, Gluten-Free)"
                    id="newRestriction"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget as HTMLInputElement;
                        addArrayItem('dietaryRestrictions', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('newRestriction') as HTMLInputElement;
                      addArrayItem('dietaryRestrictions', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userProfile?.dietaryRestrictions?.length > 0 ? (
                  userProfile.dietaryRestrictions.map((restriction: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-2">
                      {restriction}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500">No dietary restrictions</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Medical Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.medicalConditions?.map((condition: string, idx: number) => (
                    <Badge key={idx} variant="destructive" className="px-3 py-2 text-sm">
                      {condition}
                      <button
                        onClick={() => removeArrayItem('medicalConditions', idx)}
                        className="ml-2 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add condition (e.g., Diabetes, High BP)"
                    id="newCondition"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget as HTMLInputElement;
                        addArrayItem('medicalConditions', input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('newCondition') as HTMLInputElement;
                      addArrayItem('medicalConditions', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userProfile?.medicalConditions?.length > 0 ? (
                  userProfile.medicalConditions.map((condition: string, idx: number) => (
                    <Badge key={idx} variant="destructive" className="px-3 py-2">
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-500">No medical conditions</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Country</Label>
                <Input
                  value={editing ? formData.location?.country : userProfile?.location?.country}
                  onChange={(e) => updateNestedFormData('location', 'country', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={editing ? formData.location?.state : userProfile?.location?.state}
                  onChange={(e) => updateNestedFormData('location', 'state', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={editing ? formData.location?.city : userProfile?.location?.city}
                  onChange={(e) => updateNestedFormData('location', 'city', e.target.value)}
                  disabled={!editing}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Budget Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={editing ? formData.budget : userProfile?.budget}
              onValueChange={(value) => updateFormData('budget', value)}
              disabled={!editing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lower">Budget-Friendly (₹3,000-5,000/month)</SelectItem>
                <SelectItem value="middle">Moderate (₹5,000-10,000/month)</SelectItem>
                <SelectItem value="upper">Premium (₹10,000+/month)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 h-12"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 h-12"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {/* Account Info */}
        <Card className="mt-6 border-0 shadow-lg bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date(userProfile?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-green-600">
                  ✓ Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}