'use client';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  // Format wallet balance with commas and proper currency symbol
  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(balance || 0));
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span 
              className="text-xl font-bold text-primary cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              Auto Rental
            </span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-600">
                  Welcome, {user.name}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  Balance: {formatBalance(user.wallet)}
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
