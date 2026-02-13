import { create } from 'zustand'
import { DashboardData, TopIngredient } from '@/lib/api'

interface DashboardState {
  dashboard: DashboardData | null
  topIngredients: TopIngredient[]
  lastFetch: number | null
  error: string | null
  setDashboard: (data: DashboardData, ingredients: TopIngredient[]) => void
  setError: (error: string | null) => void
  clear: () => void
  isStale: () => boolean
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: null,
  topIngredients: [],
  lastFetch: null,
  error: null,

  setDashboard: (data, ingredients) => set({
    dashboard: data,
    topIngredients: ingredients,
    lastFetch: Date.now(),
    error: null
  }),

  setError: (error) => set({ error }),

  clear: () => set({
    dashboard: null,
    topIngredients: [],
    lastFetch: null,
    error: null
  }),

  isStale: () => {
    const { lastFetch } = get()
    if (!lastFetch) return true
    return Date.now() - lastFetch > CACHE_TTL
  }
}))
