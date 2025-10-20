'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, User, Mail, Activity, Target, 
  MapPin, Save, Edit2, X, Globe, Heart,
  Calendar, Scale, Ruler, TrendingUp
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
                <h1 className="text-xl font-bold">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your personal information</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
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
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-white text-purple-600 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
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

            {/* BMI Display */}
            {userProfile?.height && userProfile?.weight && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Body Mass Index (BMI)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {((userProfile.weight / (userProfile.height / 100) ** 2).toFixed(1))}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-green-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-600" />
              Health Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
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

            {userProfile?.dietaryRestrictions && userProfile.dietaryRestrictions.length > 0 && (
              <div className="mt-4">
                <Label>Dietary Restrictions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userProfile.dietaryRestrictions.map((restriction: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {userProfile?.medicalConditions && userProfile.medicalConditions.length > 0 && (
              <div className="mt-4">
                <Label>Medical Conditions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userProfile.medicalConditions.map((condition: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
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

        {/* Language Preference (Coming Soon) */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Language</Label>
              <Select disabled>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="English (Coming Soon)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                🌍 Multi-language support coming soon!
              </p>
            </div>

            <div className="mt-4">
              <Label>Budget</Label>
              <Select
                value={editing ? formData.budget : userProfile?.budget}
                onValueChange={(value) => updateFormData('budget', value)}
                disabled={!editing}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lower">Budget-Friendly (₹3,000-5,000/month)</SelectItem>
                  <SelectItem value="middle">Moderate (₹5,000-10,000/month)</SelectItem>
                  <SelectItem value="upper">Premium (₹10,000+/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <p className="text-sm text-gray-600">Onboarding Status</p>
                <p className="font-semibold text-green-600">
                  ✓ Completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}