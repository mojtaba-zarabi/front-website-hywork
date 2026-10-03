// components/ProtectedRoute.tsx
'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/contexts/UserContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useContext(UserContext);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
