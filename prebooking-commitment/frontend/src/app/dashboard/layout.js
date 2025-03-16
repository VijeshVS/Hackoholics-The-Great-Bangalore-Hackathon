'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  const { user, isAuthenticated, loading, refreshUser } = useAuthStore();
  const router = useRouter();

  // Initial auth check and data refresh
  useEffect(() => {
    const initAuth = async () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        router.push('/');
        return;
      }

      // Force an immediate refresh of user data
      await refreshUser();
    };

    initAuth();
  }, [router, refreshUser]);

  // Refresh user data periodically (every 10 seconds)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshUser, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshUser]);

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
