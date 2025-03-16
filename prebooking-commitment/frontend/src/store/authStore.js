import { create } from 'zustand';
import api from '@/utils/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  setUser: (user) => set({ 
    user: user ? {
      ...user,
      wallet: Number(user.wallet || 0)
    } : null, 
    isAuthenticated: !!user,
    loading: false,
    error: null 
  }),

  refreshUser: async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        set({ user: null, isAuthenticated: false, loading: false, error: null });
        return;
      }

      // Log the request for debugging
      console.log('Refreshing user data...');
      
      const response = await api.get('/api/users/me');
      
      // Log the response for debugging
      console.log('User data received:', response.data);
      
      set({ 
        user: {
          ...response.data,
          wallet: Number(response.data.wallet || 0)
        }, 
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      if (error.response?.status === 401) {
        // Clear token on unauthorized
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        set({ 
          user: null, 
          isAuthenticated: false,
          loading: false,
          error: 'Session expired. Please login again.'
        });
      } else {
        set({
          loading: false,
          error: error.response?.data?.message || 'Failed to load user data'
        });
      }
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/users/login', { email, password });
      const { token, user } = response.data;

      // Log the login response for debugging
      console.log('Login response:', { user });

      // Set token in cookie (HTTP-only for security)
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Strict; Secure`; // 7 days

      set({ 
        user: {
          ...user,
          wallet: Number(user.wallet || 0)
        }, 
        isAuthenticated: true,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      set({ 
        loading: false,
        error: error.response?.data?.message || 'Login failed'
      });
      return false;
    }
  },

  register: async (userData) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/api/users/register', userData);
      const { token, user } = response.data;

      // Log the registration response for debugging
      console.log('Registration response:', { user });

      // Set token in cookie (HTTP-only for security)
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Strict; Secure`; // 7 days

      set({ 
        user: {
          ...user,
          wallet: Number(user.wallet || 0)
        }, 
        isAuthenticated: true,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      set({ 
        loading: false,
        error: error.response?.data?.message || 'Registration failed'
      });
      return false;
    }
  },

  logout: () => {
    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Clear user data
    set({ 
      user: null, 
      isAuthenticated: false,
      loading: false,
      error: null
    });
  },

  clearError: () => set({ error: null })
}));

// Initialize user data by fetching from server only if we have a token
if (typeof window !== 'undefined') {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (token) {
    useAuthStore.getState().refreshUser();
  }
}

export default useAuthStore;
