'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Send,
  User,
  Sparkles,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function DoctorChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello — I'm Dr. HealthAI. I coach on nutrition, gym fueling, sleep, and common health questions using your MealDeal profile. Ask anything practical (pre/post workout food, vitamins, meal swaps). For emergencies or diagnosis, see a clinician in person.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } else {
        toast.error('Failed to get response. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What should I eat pre and post workout?',
    'Which foods give vitamin C, D, A and B?',
    'Oats + peanut butter — is that a good snack?',
    'How do I pick milk fat % for my goal?',
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_#f5f3ff_45%,_#fdf2f8_100%)]" />
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-indigo-300/25 blur-3xl" />

      <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Image
                src="/dr-health-ai.png"
                alt="Dr. HealthAI"
                width={44}
                height={44}
                className="rounded-full ring-2 ring-teal-400/60 shadow-md object-cover"
                priority
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Dr. HealthAI
              </h1>
              <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> Clinical nutrition coach · Online
              </p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-slate-200">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Hero identity strip */}
        <section className="rounded-2xl overflow-hidden border border-white/70 shadow-xl bg-gradient-to-br from-slate-900 via-teal-900 to-indigo-950 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-teal-400/40 blur-xl scale-110" />
              <Image
                src="/dr-health-ai.png"
                alt="Dr. HealthAI portrait"
                width={112}
                height={112}
                className="relative rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
                priority
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">
                MealDeal · Health desk
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Dr. HealthAI
              </h2>
              <p className="text-sm text-slate-200/90 max-w-xl leading-relaxed">
                Answers tailored to your age, BMI, goals, and conditions — with India-friendly food
                examples (oats, PB, citrus, dals, fortified milk) and clear gym timing advice.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-teal-300" /> Safety-first
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 px-2.5 py-1 rounded-full">
                  <Leaf className="w-3 h-3 text-emerald-300" /> Micronutrients
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-white/10 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Workout fueling
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Chat panel */}
        <div className="flex-1 min-h-[420px] rounded-2xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {message.role === 'assistant' ? (
                  <Avatar className="flex-shrink-0 h-10 w-10 ring-2 ring-teal-200">
                    <AvatarImage src="/dr-health-ai.png" alt="Dr. HealthAI" />
                    <AvatarFallback className="bg-teal-600 text-white text-xs">DR</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="flex-shrink-0 h-10 w-10 bg-indigo-600">
                    <AvatarFallback className="bg-indigo-600 text-white">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[88%] sm:max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {message.role === 'user' ? 'You' : 'Dr. HealthAI'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-md'
                        : 'bg-gradient-to-br from-slate-50 to-teal-50/80 text-slate-800 border border-teal-100/80 rounded-tl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="doctor-md text-sm leading-relaxed prose prose-sm prose-teal max-w-none
                        prose-headings:text-teal-900 prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-2 prose-headings:text-base
                        prose-p:my-2 prose-strong:text-teal-950
                        prose-ul:my-2 prose-li:my-0.5
                        prose-table:text-xs prose-th:bg-teal-100/80 prose-th:px-2 prose-th:py-1.5 prose-td:px-2 prose-td:py-1.5 prose-td:border-teal-100
                        prose-a:text-teal-700">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <Avatar className="h-10 w-10 ring-2 ring-teal-200">
                  <AvatarImage src="/dr-health-ai.png" alt="Dr. HealthAI" />
                  <AvatarFallback className="bg-teal-600 text-white text-xs">DR</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.12s' }}
                    />
                    <div
                      className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.24s' }}
                    />
                  </div>
                  <span className="text-sm text-slate-600">Reviewing your profile…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 sm:px-6 pb-3">
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="text-xs px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50/70 text-teal-900 hover:bg-teal-100 transition"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-teal-50/40">
            <div className="flex gap-2 sm:gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about vitamins, workouts, meals…"
                disabled={loading}
                className="flex-1 h-12 text-base bg-white border-slate-200 focus-visible:ring-teal-500"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="h-12 px-5 bg-gradient-to-r from-teal-600 to-indigo-700 hover:from-teal-700 hover:to-indigo-800 shadow-md"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Educational coaching only — not a substitute for in-person medical care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
