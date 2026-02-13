import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { recipesApi, Recipe } from '@/lib/api'
import { toast } from 'sonner'

interface RecipesForOrdersState {
  recipes: Recipe[]
  lastFetch: number | null
  setRecipes: (recipes: Recipe[]) => void
  isStale: () => boolean
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

const useRecipesForOrdersStore = create<RecipesForOrdersState>((set, get) => ({
  recipes: [],
  lastFetch: null,

  setRecipes: (recipes) => set({
    recipes,
    lastFetch: Date.now()
  }),

  isStale: () => {
    const { lastFetch } = get()
    if (!lastFetch) return true
    return Date.now() - lastFetch > CACHE_TTL
  }
}))

export function useRecipesForOrders() {
  const { recipes, isStale, setRecipes } = useRecipesForOrdersStore()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (recipes.length === 0 || isStale()) {
      fetchRecipes()
    }
  }, [])

  const fetchRecipes = async () => {
    try {
      if (recipes.length === 0) setIsValidating(true)

      const response = await recipesApi.list({ limit: 1000 })
      setRecipes(response.data.data)
    } catch (error) {
      toast.error('Erro ao carregar receitas')
    } finally {
      setIsValidating(false)
    }
  }

  return {
    recipes,
    isValidating,
    refetch: fetchRecipes
  }
}
