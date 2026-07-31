'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Dashboard from '@/components/dashboard';

export default function DashboardPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.assign('/login');
    }
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen md-page bg-mesh flex items-center justify-center">
        <div className="text-center text-emerald-900">
          <div className="w-12 h-12 border-2 border-emerald-900/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
