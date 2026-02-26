import { create } from 'zustand'

interface AppState {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export const useStore = create<AppState>((set) => ({
  activeMenu: 'index',
  setActiveMenu: (menu) => set({ activeMenu: menu }),
}))
