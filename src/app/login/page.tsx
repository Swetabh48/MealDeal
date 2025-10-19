'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Welcome back! 🎉');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden md:block text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-rose-500 p-4 rounded-2xl">
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Continue your journey to better health
          </p>
          <div className="space-y-4 text-left max-w-md mx-auto">
            {[
              'Personalized nutrition plans',
              '24/7 AI doctor consultation',
              'Track your progress easily',
              'Budget-friendly meal plans'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-rose-500 rounded-full"></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div>
          <Link href="/">
            <Button variant="ghost" className="mb-6 hover:bg-white/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900">Sign In</h2>
                <p className="text-gray-600">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-base font-medium flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12"
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
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    Create one now
                  </Link>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
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