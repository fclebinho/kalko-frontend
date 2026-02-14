/**
 * Hook para monitorar status de recálculos em andamento
 *
 * Faz polling do endpoint /recipes/recalculation/status
 * enquanto houver jobs pendentes.
 *
 * @example
 * ```tsx
 * const { pending, isRecalculating } = useRecalculationStatus()
 *
 * if (isRecalculating) {
 *   return <Badge>Recalculando {pending} receitas...</Badge>
 * }
 * ```
 */

import { useEffect, useState } from 'react'
import { recipesApi } from '@/lib/api'

export function useRecalculationStatus() {
  const [pending, setPending] = useState(0)
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      try {
        const response = await recipesApi.recalculationStatus()
        const { pending: pendingCount, recipeIds: ids } = response.data

        setPending(pendingCount)
        setRecipeIds(ids)

        // Se não há jobs pendentes, parar polling
        if (pendingCount === 0 && intervalId) {
          clearInterval(intervalId)
          setIsPolling(false)
        }
      } catch (error) {
        console.error('[RecalculationStatus] Error:', error)
      }
    }

    // Verificar inicialmente
    checkStatus()

    // Iniciar polling se ainda não está rodando
    if (!intervalId) {
      intervalId = setInterval(checkStatus, 3000) // Poll a cada 3 segundos
      setIsPolling(true)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  return {
    pending,
    recipeIds,
    isRecalculating: pending > 0,
    isPolling,
  }
}
