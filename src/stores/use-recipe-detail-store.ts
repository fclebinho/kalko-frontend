/**
 * Recipe Detail Store - Zustand
 *
 * Cache de detalhes de receitas individuais com TTL de 2 minutos.
 * Indexado por ID para acesso rápido sem flickering.
 */
import { create } from 'zustand'

interface RecipeDetailCache {
  [id: string]: {
    data: any // RecipeDetails type from the component
    timestamp: number
  }
}

interface RecipeDetailState {
  cache: RecipeDetailCache
  setRecipe: (id: string, data: any) => void
  getCached: (id: string) => any | null
  invalidate: (id?: string) => void
}

const CACHE_TTL = 2 * 60 * 1000 // 2 minutos

export const useRecipeDetailStore = create<RecipeDetailState>((set, get) => ({
  cache: {},

  setRecipe: (id, data) => {
    set(state => ({
      cache: {
        ...state.cache,
        [id]: { data, timestamp: Date.now() }
      }
    }))
  },

  getCached: (id) => {
    const cached = get().cache[id]
    if (!cached) return null
    if (Date.now() - cached.timestamp > CACHE_TTL) return null
    return cached.data
  },

  invalidate: (id) => {
    if (id) {
      set(state => {
        const newCache = { ...state.cache }
        delete newCache[id]
        return { cache: newCache }
      })
    } else {
      set({ cache: {} })
    }
  }
}))
