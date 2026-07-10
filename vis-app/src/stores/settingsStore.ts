import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

interface SettingsStore {
  settings: AppSettings;
  update: (updates: Partial<AppSettings>) => void;
  reset: () => void;
}

const defaults: AppSettings = {
  theme: 'light',
  language: 'en',
  autoSaveInterval: 30,
  maxCsvRows: 100_000,
  units: 'mm',
  showGrid: true,
  showCrosshair: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: { ...defaults },
      update: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
      reset: () => set({ settings: { ...defaults } }),
    }),
    { name: 'mvs-settings' },
  ),
);
