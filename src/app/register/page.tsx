'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Lock, ArrowLeft, Heart, Eye, EyeOff, CheckCircle } from 'lucide-react';


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! 🎉');
        
        // Auto-login after registration
        const result = await signIn('credentials', {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/onboarding');
        } else {
          router.push('/login');
        }
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden text-emerald-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div className="hidden md:block">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-emerald-900 p-4 rounded-2xl shadow-lg">
              <Heart className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold mb-4 text-emerald-950">
            Start Your Health Journey
          </h1>
          <p className="text-xl text-emerald-800/70 mb-8">
            Join thousands transforming their lives with personalized nutrition
          </p>

          <div className="space-y-6">
            {[
              {
                title: 'Free Forever',
                desc: 'No credit card required. Start your health journey today.',
              },
              {
                title: 'AI-Powered Plans',
                desc: 'Get science-based nutrition plans tailored to your goals.',
              },
              {
                title: '24/7 Doctor Chat',
                desc: 'Medical guidance available anytime you need it.',
              },
              {
                title: 'Track Progress',
                desc: 'Visual insights and charts to celebrate your wins.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 clay-card p-4">
                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-emerald-950 mb-1">{item.title}</h3>
                  <p className="text-sm text-emerald-800/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <a href="/">
            <Button variant="ghost" className="mb-6 hover:bg-white/50 text-emerald-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </a>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm clay-card">
            <CardContent className="p-8 md:p-12">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold mb-2 text-emerald-950">Create Account</h2>
                <p className="text-emerald-800/70">Get started in less than 2 minutes</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base font-medium flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="h-12 text-base border-emerald-900/15 focus:border-amber-400 focus:ring-amber-400"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="h-12 text-base border-emerald-900/15 focus:border-amber-400 focus:ring-amber-400"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="h-12 text-base border-emerald-900/15 focus:border-amber-400 focus:ring-amber-400 pr-12"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              idx < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {strength > 0 && (
                        <p className="text-xs text-emerald-800/70">
                          Password strength:{' '}
                          <span className="font-medium">{strengthLabels[strength - 1]}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="h-12 text-base border-emerald-900/15 focus:border-amber-400 focus:ring-amber-400 pr-12"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-emerald-800/70">
                  Already have an account?{' '}
                  <a href="/login" className="text-emerald-900 font-semibold hover:text-amber-600 transition-colors">
                    Sign in
                  </a>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-900/10">
                <p className="text-xs text-center text-emerald-800/50">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}