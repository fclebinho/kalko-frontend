import { useEffect, useState } from 'react'
import { useRecipesStore } from '@/stores/use-recipes-store'
import { recipesApi } from '@/lib/api'
import { toast } from 'sonner'

export function useRecipes(search: string, page: number) {
  const { setRecipes, optimisticDelete, invalidate } = useRecipesStore()
  const [isValidating, setIsValidating] = useState(false)

  // 🔥 FIX: Subscribe to cache reactively
  const cacheKey = `${search}:${page}`
  const cached = useRecipesStore(state => state.cache[cacheKey])
  const isStale = cached ? (Date.now() - cached.timestamp > 2 * 60 * 1000) : true

  useEffect(() => {
    if (!cached || isStale) {
      fetchRecipes()
    }
  }, [search, page, cached, isStale])

  const fetchRecipes = async () => {
    try {
      if (!cached) setIsValidating(true)

      const response = await recipesApi.list({ search, page })
      setRecipes(search, page, response.data.data, response.data.pagination)
    } catch (error) {
      toast.error('Erro ao carregar receitas')
    } finally {
      setIsValidating(false)
    }
  }

  const deleteRecipe = async (id: string, name: string) => {
    optimisticDelete(id, search, page)

    try {
      await recipesApi.delete(id)
      toast.success('Receita excluída')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir receita')
      fetchRecipes()
    }
  }

  return {
    recipes: cached?.data || [],
    pagination: cached?.pagination || null,
    isValidating,
    deleteRecipe,
    refetch: fetchRecipes,
    invalidateAll: invalidate
  }
}
