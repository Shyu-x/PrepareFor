import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  activeMenu: string
  setActiveMenu: (menu: string) => void
  // 搜索相关
  searchQuery: string
  setSearchQuery: (query: string) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void
  // 主题相关
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  // 收藏相关
  favorites: string[]
  addFavorite: (menu: string) => void
  removeFavorite: (menu: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeMenu: 'index',
      setActiveMenu: (menu) => set({ activeMenu: menu }),

      // 搜索相关
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),

      // 主题相关
      isDarkMode: false,
      setIsDarkMode: (dark) => set({ isDarkMode: dark }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // 收藏相关
      favorites: [],
      addFavorite: (menu) => set((state) => ({
        favorites: state.favorites.includes(menu)
          ? state.favorites
          : [...state.favorites, menu]
      })),
      removeFavorite: (menu) => set((state) => ({
        favorites: state.favorites.filter(f => f !== menu)
      })),
    }),
    {
      name: 'prepare-for-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        favorites: state.favorites,
      }),
    }
  )
)
