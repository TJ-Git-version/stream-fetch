import { create } from 'zustand'
import { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  downloadPath: '',
  maxConcurrent: 3,
  language: 'zh-CN',
  theme: 'dark',
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
  resetSettings: () => set({ settings: defaultSettings }),
}))