/**
 * Hook para monitorar status de recálculos em andamento
 *
 * Usa WebSocket para receber atualizações em tempo real do backend.
 * Fallback para polling inicial se WebSocket ainda não conectado.
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
import { useSocket } from './use-socket'
import { onRecalculationUpdate } from '@/lib/socket'

export function useRecalculationStatus() {
  const { socket, isConnected } = useSocket()
  const [pending, setPending] = useState(0)
  const [recipeIds, setRecipeIds] = useState<string[]>([])

  // Fetch inicial ao montar (fallback enquanto WebSocket não conecta)
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await recipesApi.recalculationStatus()
        const { pending: pendingCount, recipeIds: ids } = response.data

        setPending(pendingCount)
        setRecipeIds(ids)
      } catch (error) {
        console.error('[RecalculationStatus] Error checking initial status:', error)
      }
    }

    checkInitialStatus()
  }, [])

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log('[RecalculationStatus] Listening for WebSocket updates')

    const unsubscribe = onRecalculationUpdate((data) => {
      console.log('[RecalculationStatus] Received update:', data)

      setPending(data.pending)
      setRecipeIds(data.recipeIds)
    })

    return () => {
      unsubscribe()
    }
  }, [socket, isConnected])

  return {
    pending,
    recipeIds,
    isRecalculating: pending > 0,
    isConnected, // Expor status de conexão WebSocket
  }
}
