import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set) => ({
  isSetup: true,
  isAuthenticated: false,
  username: null,
  loading: true,

  checkAuth: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/auth/me');
      set({
        isSetup: res.data.isSetup,
        isAuthenticated: res.data.isAuthenticated,
        username: res.data.username,
        loading: false
      });
    } catch (err) {
      set({ loading: false, isAuthenticated: false });
    }
  },

  login: async (password) => {
    const res = await api.post('/auth/login', { password });
    set({ isAuthenticated: true, username: res.data.username });
    return res;
  },

  setupPassword: async (password) => {
    const res = await api.post('/auth/setup', { password });
    set({ isSetup: true, isAuthenticated: true, username: res.data.username });
    return res;
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ isAuthenticated: false, username: null });
  }
}));
