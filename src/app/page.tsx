import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, Users, Brain, TrendingUp, Shield,
  Sparkles, Activity, Apple, MessageCircle, 
  CheckCircle, Star, ArrowRight 
} from 'lucide-react';
import React from 'react';

export default function Home() {
  const features = [
    {
      icon: <Brain />,
      title: 'AI-Powered Personalization',
      desc: 'Advanced AI analyzes your profile, goals, and preferences to create perfect meal plans',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <MessageCircle />,
      title: '24/7 AI Doctor Chat',
      desc: 'Get instant medical guidance and nutritional advice anytime you need it',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      icon: <Apple />,
      title: 'Dynamic Meal Planning',
      desc: 'Daily varying meals with local ingredients that fit your budget and taste',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50'
    },
    {
      icon: <Activity />,
      title: 'Progress Tracking',
      desc: 'Visual charts and insights to monitor your health journey and celebrate wins',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: <Shield />,
      title: 'Medical Report Analysis',
      desc: 'Upload prescriptions and test results for personalized recommendations',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      icon: <Users />,
      title: 'All-Age Friendly',
      desc: 'Simple, intuitive interface designed for everyone from teens to seniors',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Share Your Story',
      desc: 'Tell us about your health goals, challenges, and lifestyle in your own words',
      icon: <MessageCircle />
    },
    {
      step: '02',
      title: 'Get Your Plan',
      desc: 'AI creates a personalized nutrition plan with local, affordable ingredients',
      icon: <Brain />
    },
    {
      step: '03',
      title: 'Track & Succeed',
      desc: 'Follow daily meal plans, chat with AI doctor, and watch your progress',
      icon: <TrendingUp />
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      age: '62 years',
      result: 'Lost 12kg in 3 months',
      quote: 'The personalized meal plans fit my budget and local food availability perfectly. The AI doctor helped me understand my diabetes better.',
      rating: 5
    },
    {
      name: 'Priya Sharma',
      age: '45 years',
      result: 'Improved cholesterol levels',
      quote: 'Finally, a health app that understands Indian dietary needs! The daily meal variations keep it interesting.',
      rating: 5
    },
    {
      name:'Vivek Mishra',
      age: '21 years',
      result: 'Gained muscle mass',
      quote: 'As a college student on a budget, MealDeal helped me eat healthy without overspending. The meal plans are easy to follow and delicious!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-rose-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-rose-500 bg-clip-text text-transparent">
                MealDeal
              </span>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white shadow-lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6 border border-blue-200">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Personalized Nutrition</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Journey to
            <span className="block bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 bg-clip-text text-transparent">
              Better Health
            </span>
            Starts Here
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            Get science-based, doctor-approved nutrition plans tailored to your unique needs, 
            goals, and lifestyle. Available 24/7 with AI health guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-rose-500 hover:from-blue-700 hover:to-rose-600 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all">
                Start Your Free Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 hover:border-blue-600 hover:text-blue-600">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Science-Based Plans</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Locally Available Foods</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Budget-Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need for
              <span className="block text-blue-600">Complete Health Transformation</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you achieve your health goals with ease
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className={`${feature.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                    {React.cloneElement(feature.icon, { className: `w-10 h-10 ${feature.color}` })}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and effective</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-6xl font-bold text-blue-100 mb-4">{item.step}</div>
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-white">
                    {React.cloneElement(item.icon, { className: 'w-8 h-8 text-white' })}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8">
                    <ArrowRight className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Thousands</h2>
            <p className="text-xl text-gray-600">Real results from real people</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                  <div className="border-t pt-4">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.age}</p>
                    <p className="text-sm font-semibold text-green-600 mt-2">{testimonial.result}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0ZXJuPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100">
            Join thousands who have already started their journey to a healthier, happier life
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-7 text-xl shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1">
              Start Your Free Journey Today
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
          <p className="mt-6 text-blue-100">No credit card required • Takes less than 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-rose-500" />
              <span className="text-2xl font-bold">MealDeal</span>
            </div>
            <div className="flex gap-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>© 2025 Salampuria. Built with ❤️ for better health</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
