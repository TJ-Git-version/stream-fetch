import { create } from 'zustand'

type FilterStatus = 'all' | 'downloading' | 'completed' | 'failed'

interface UIStore {
  sidebarCollapsed: boolean
  activeFilter: FilterStatus
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveFilter: (filter: FilterStatus) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  activeFilter: 'all',
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}))