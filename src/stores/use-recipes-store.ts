/**
 * Recipes Store - Zustand
 *
 * Cache paginado de receitas com TTL de 2 minutos.
 * Suporta optimistic updates para delete operations.
 */
import { create } from 'zustand'
import { Recipe, PaginationInfo } from '@/lib/api'

interface RecipesCache {
  [key: string]: {
    data: Recipe[]
    pagination: PaginationInfo
    timestamp: number
  }
}

interface RecipesState {
  cache: RecipesCache
  setRecipes: (search: string, page: number, data: Recipe[], pagination: PaginationInfo) => void
  getCached: (search: string, page: number) => { data: Recipe[]; pagination: PaginationInfo } | null
  invalidate: () => void
  optimisticDelete: (id: string, search: string, page: number) => void
}

const CACHE_TTL = 2 * 60 * 1000 // 2 minutos

export const useRecipesStore = create<RecipesState>((set, get) => ({
  cache: {},

  setRecipes: (search, page, data, pagination) => {
    const key = `${search}:${page}`
    set(state => ({
      cache: {
        ...state.cache,
        [key]: { data, pagination, timestamp: Date.now() }
      }
    }))
  },

  getCached: (search, page) => {
    const key = `${search}:${page}`
    const cached = get().cache[key]

    if (!cached) return null
    if (Date.now() - cached.timestamp > CACHE_TTL) return null

    return { data: cached.data, pagination: cached.pagination }
  },

  invalidate: () => set({ cache: {} }),

  optimisticDelete: (id, search, page) => {
    const key = `${search}:${page}`
    const current = get().cache[key]
    if (!current) return

    set(state => ({
      cache: {
        ...state.cache,
        [key]: {
          ...current,
          data: current.data.filter(r => r.id !== id),
          pagination: {
            ...current.pagination,
            total: current.pagination.total - 1
          }
        }
      }
    }))
  }
}))
