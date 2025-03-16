'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'passenger',
    phoneNumber: ''
  });

  // Handle auth store errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = isLogin 
        ? await login(formData.email, formData.password)
        : await register(formData);

      if (success) {
        toast.success(isLogin ? 'Welcome back!' : 'Registration successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'passenger',
      phoneNumber: ''
    });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? 'Welcome Back!' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                className="input w-full"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required={!isLogin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="input w-full"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required={!isLogin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="input w-full"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                required={!isLogin}
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="input w-full"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            className="input w-full"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
        </button>

        <p className="text-center mt-4 text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary font-medium ml-1 hover:underline"
          >
            {isLogin ? 'Create one' : 'Login here'}
          </button>
        </p>
      </form>
    </div>
  );
}
