import { useEffect, useState } from 'react'
import { useRecipeDetailStore } from '@/stores/use-recipe-detail-store'
import { recipesApi } from '@/lib/api'
import { toast } from 'sonner'

const CACHE_TTL = 2 * 60 * 1000 // 2 minutos

export function useRecipeDetail(id: string) {
  // Subscribe to the specific cache entry so component re-renders when it changes
  const cacheEntry = useRecipeDetailStore(state => state.cache[id])
  const setRecipe = useRecipeDetailStore(state => state.setRecipe)
  const invalidate = useRecipeDetailStore(state => state.invalidate)
  const [isValidating, setIsValidating] = useState(false)

  // Check if cache is stale
  const isStale = !cacheEntry || (Date.now() - cacheEntry.timestamp > CACHE_TTL)

  useEffect(() => {
    if (isStale && id) {
      fetchRecipe()
    }
  }, [id, isStale])

  const fetchRecipe = async () => {
    if (!id) return

    try {
      if (!cacheEntry) setIsValidating(true)

      const response = await recipesApi.get(id)
      setRecipe(id, response.data)
    } catch (error) {
      toast.error('Erro ao carregar receita')
    } finally {
      setIsValidating(false)
    }
  }

  return {
    recipe: cacheEntry?.data || null,
    isValidating,
    refetch: fetchRecipe,
    invalidate: () => invalidate(id)
  }
}
