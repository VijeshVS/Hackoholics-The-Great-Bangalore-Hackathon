'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import RideList from '@/components/RideList';

export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) {
    return null; // Layout will handle loading state
  }

  // Format wallet balance with commas and proper currency symbol
  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(balance || 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {user.role === 'passenger' ? 'Book a Ride' : 'Available Rides'}
        </h1>
        <div className="text-sm text-gray-600 font-medium">
          Balance: {formatBalance(user.wallet)}
        </div>
      </div>
      <RideList />
    </div>
  );
}
