'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowLeft, Heart, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // redirect:true lets NextAuth set the cookie then navigate — no toast/login race
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        callbackUrl: '/dashboard',
        redirect: true,
      });

      // Only reached if redirect is blocked / failed
      if (result?.error) {
        toast.error('Invalid email or password');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden text-emerald-950">
      {/* Soft depth orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden md:block text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-emerald-900 p-4 rounded-2xl shadow-lg">
              <Heart className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold mb-4 text-emerald-950">
            Welcome Back
          </h1>
          <p className="text-xl text-emerald-800/70 mb-8">
            Continue your journey to better health
          </p>
          <div className="space-y-4 text-left max-w-md mx-auto">
            {[
              'Personalized nutrition plans',
              '24/7 AI doctor consultation',
              'Track your progress easily',
              'Budget-friendly meal plans'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 clay-card p-4">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-emerald-900/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
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
                <h2 className="font-display text-3xl font-bold mb-2 text-emerald-950">Sign In</h2>
                <p className="text-emerald-800/70">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-800 focus:ring-amber-400" />
                    <span className="text-sm text-emerald-800/70">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-emerald-800 hover:text-emerald-950 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-emerald-800/70">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-emerald-900 font-semibold hover:text-amber-600 transition-colors">
                    Create one now
                  </Link>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-900/10">
                <p className="text-xs text-center text-emerald-800/50">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}