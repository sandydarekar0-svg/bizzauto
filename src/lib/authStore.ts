import { create } from 'zustand';
import { authAPI } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  businessId: string;
  avatar?: string;
  lastLogin?: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
  city?: string;
  plan: string;
  aiCreditsUsed?: number;
  aiCreditsLimit?: number;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  onboardingCompleted: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  register: (data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    businessType: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  setOnboardingCompleted: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  business: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  onboardingCompleted: false,

  initialize: async () => {
    set({ isLoading: true });

    // Demo mode removed - always use real auth
    localStorage.removeItem('demoMode');

    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await authAPI.getProfile();
      const { user, business } = res.data.data;
      const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
      set({
        token,
        user,
        business,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        onboardingCompleted,
      });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, business: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      const { user, business, token } = res.data.data;
      localStorage.setItem('token', token);
      set({ user, business, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || error.response?.data?.message || 'Invalid email or password';
      throw new Error(message);
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register(data);
      const { user, business, token } = res.data.data;
      localStorage.setItem('token', token);
      set({ user, business, token, isAuthenticated: true, isLoading: false, onboardingCompleted: false });
    } catch (error: any) {
      set({ isLoading: false });
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('demoMode');
    set({ user: null, business: null, token: null, isAuthenticated: false, onboardingCompleted: false });
  },

  demoLogin: () => {
    // Demo mode removed - redirect to register instead
    // This is kept as a no-op to avoid breaking LoginPage import
  },

  updateProfile: async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      const { user } = res.data.data;
      set({ user });
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Update failed. Please try again.';
      throw new Error(message);
    }
  },

  setOnboardingCompleted: (val) => {
    localStorage.setItem('onboardingCompleted', val ? 'true' : 'false');
    set({ onboardingCompleted: val });
  },
}));
