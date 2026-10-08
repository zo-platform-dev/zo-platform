import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

import { API_BASE_URL } from '../config/api';
const API_URL = API_BASE_URL;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, { email, password });
          const { user, token } = response.data;

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
          const { user, token } = response.data;

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          set({ user: response.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateProfile: async (updates) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.put(`${API_URL}/auth/me`, updates);
          set({ user: response.data.user, loading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Update failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ loading: true, error: null });
        try {
          await axios.post(`${API_URL}/auth/change-password`, { currentPassword, newPassword });
          set({ loading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Password change failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'zo-auth',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);