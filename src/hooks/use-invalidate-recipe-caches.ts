/**
 * Hook centralizado para invalidação de caches relacionados a receitas
 *
 * Use este hook quando uma operação no backend recalcula receitas:
 * - Atualizar/deletar ingredientes
 * - Importar CSV de ingredientes
 * - Editar/recalcular receitas
 * - Atualizar custos operacionais (horas, fixos, variáveis)
 *
 * @example
 * ```tsx
 * const invalidateRecipeCaches = useInvalidateRecipeCaches()
 *
 * const handleUpdate = async () => {
 *   await api.updateIngredient(id, data)
 *   invalidateRecipeCaches() // Invalida todos os caches relacionados
 * }
 * ```
 */

import { useRecipesStore } from '@/stores/use-recipes-store'
import { useRecipeDetailStore } from '@/stores/use-recipe-detail-store'
import { useDashboardStore } from '@/stores/use-dashboard-store'

export function useInvalidateRecipeCaches() {
  const invalidateRecipesList = useRecipesStore(state => state.invalidate)
  const invalidateRecipeDetails = useRecipeDetailStore(state => state.invalidate)
  const invalidateDashboard = useDashboardStore(state => state.clear)

  /**
   * Invalida todos os caches que dependem de dados de receitas:
   * - Lista de receitas (paginada)
   * - Detalhes de receitas individuais
   * - Dashboard (métricas agregadas)
   *
   * @param options - Opções de invalidação
   * @param options.recipeId - Se fornecido, invalida apenas este detalhe específico
   * @param options.skipDashboard - Se true, não invalida o dashboard
   */
  return (options?: { recipeId?: string; skipDashboard?: boolean }) => {
    invalidateRecipesList()

    if (options?.recipeId) {
      invalidateRecipeDetails(options.recipeId)
    } else {
      invalidateRecipeDetails() // Invalida todos os detalhes
    }

    if (!options?.skipDashboard) {
      invalidateDashboard()
    }
  }
}
