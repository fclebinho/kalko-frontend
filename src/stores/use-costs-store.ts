/**
 * Costs Store - Zustand
 *
 * Cache das configurações de custos com TTL de 5 minutos.
 * Elimina flickering ao navegar e reduz requests ao backend.
 */
import { create } from 'zustand'
import { CostsSettings } from '@/lib/api'

interface CostsState {
  settings: CostsSettings | null
  lastFetch: number | null
  error: string | null
  setSettings: (settings: CostsSettings) => void
  setError: (error: string | null) => void
  clear: () => void
  isStale: () => boolean
  invalidate: () => void
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export const useCostsStore = create<CostsState>((set, get) => ({
  settings: null,
  lastFetch: null,
  error: null,

  setSettings: (settings) => set({
    settings,
    lastFetch: Date.now(),
    error: null
  }),

  setError: (error) => set({ error }),

  clear: () => set({
    settings: null,
    lastFetch: null,
    error: null
  }),

  isStale: () => {
    const { lastFetch } = get()
    if (!lastFetch) return true
    return Date.now() - lastFetch > CACHE_TTL
  },

  invalidate: () => set({ lastFetch: null })
}))
