import { useEffect, useState } from 'react'
import { useIngredientsStore } from '@/stores/use-ingredients-store'
import { ingredientsApi } from '@/lib/api'
import { toast } from 'sonner'

export function useIngredients(search: string, page: number) {
  const { getCached, setIngredients, optimisticDelete, invalidate } = useIngredientsStore()
  const [isValidating, setIsValidating] = useState(false)
  const cached = getCached(search, page)

  useEffect(() => {
    if (!cached) {
      fetchIngredients()
    }
  }, [search, page])

  const fetchIngredients = async () => {
    try {
      if (!cached) setIsValidating(true)

      const response = await ingredientsApi.list({ search, page })
      setIngredients(search, page, response.data.data, response.data.pagination)
    } catch (error) {
      toast.error('Erro ao carregar ingredientes')
    } finally {
      setIsValidating(false)
    }
  }

  const deleteIngredient = async (id: string, name: string) => {
    optimisticDelete(id, search, page)

    try {
      await ingredientsApi.delete(id)
      toast.success('Ingrediente excluído')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir ingrediente')
      fetchIngredients()
    }
  }

  return {
    ingredients: cached?.data || [],
    pagination: cached?.pagination || null,
    isValidating,
    deleteIngredient,
    refetch: fetchIngredients,
    invalidateAll: invalidate
  }
}
