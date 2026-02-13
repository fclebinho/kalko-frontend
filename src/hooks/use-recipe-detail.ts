import { useEffect, useState } from 'react'
import { useRecipeDetailStore } from '@/stores/use-recipe-detail-store'
import { recipesApi } from '@/lib/api'
import { toast } from 'sonner'

export function useRecipeDetail(id: string) {
  const { getCached, setRecipe, invalidate } = useRecipeDetailStore()
  const [isValidating, setIsValidating] = useState(false)
  const cached = getCached(id)

  useEffect(() => {
    if (!cached && id) {
      fetchRecipe()
    }
  }, [id])

  const fetchRecipe = async () => {
    if (!id) return

    try {
      if (!cached) setIsValidating(true)

      const response = await recipesApi.get(id)
      setRecipe(id, response.data)
    } catch (error) {
      toast.error('Erro ao carregar receita')
    } finally {
      setIsValidating(false)
    }
  }

  return {
    recipe: cached,
    isValidating,
    refetch: fetchRecipe,
    invalidate: () => invalidate(id)
  }
}
