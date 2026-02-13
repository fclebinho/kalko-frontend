import { useEffect, useState } from 'react'
import { useRecipesStore } from '@/stores/use-recipes-store'
import { recipesApi } from '@/lib/api'
import { toast } from 'sonner'

export function useRecipes(search: string, page: number) {
  const { getCached, setRecipes, optimisticDelete, invalidate } = useRecipesStore()
  const [isValidating, setIsValidating] = useState(false)
  const cached = getCached(search, page)

  useEffect(() => {
    if (!cached) {
      fetchRecipes()
    }
  }, [search, page])

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
