import { create } from 'zustand';
import api from '../api/client';

export const useSettingsStore = create((set) => ({
  settings: {
    businessName: 'Al Harmain Foam Center',
    address: 'Main Market, City',
    phone: '0300-1234567'
  },
  loading: false,

  fetchSettings: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/settings');
      if (res.data) {
        set({ settings: res.data, loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set({ loading: true });
    const res = await api.put('/settings', newSettings);
    set({ settings: res.data, loading: false });
    return res;
  }
}));
