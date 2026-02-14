/**
 * Hook para monitorar status de recálculos em andamento
 *
 * Usa SSE (Server-Sent Events) para receber atualizações em tempo real.
 * SSE é mais seguro que WebSocket direto pois usa API Routes como proxy.
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

import { useEffect, useState, useRef } from 'react'
import { recipesApi } from '@/lib/api'

interface RecalculationUpdate {
  pending: number
  recipeIds: string[]
  completed?: boolean
}

export function useRecalculationStatus() {
  const [pending, setPending] = useState(0)
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch inicial ao montar
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

  // SSE real-time updates
  useEffect(() => {
    console.log('[RecalculationStatus] Connecting to SSE stream...')

    // Criar EventSource para receber SSE
    const eventSource = new EventSource('/api/recalculation/stream')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[RecalculationStatus] SSE connected')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'recalculation:update') {
          const data = message.payload as RecalculationUpdate

          console.log('[RecalculationStatus] Received update:', data)

          setPending(data.pending)
          setRecipeIds(data.recipeIds)
        }
      } catch (error) {
        console.error('[RecalculationStatus] Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[RecalculationStatus] SSE error:', error)
      setIsConnected(false)

      // EventSource automaticamente tenta reconectar
      // Se quiser implementar lógica customizada de reconexão, fazer aqui
    }

    // Cleanup ao desmontar
    return () => {
      console.log('[RecalculationStatus] Closing SSE connection')
      eventSource.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  return {
    pending,
    recipeIds,
    isRecalculating: pending > 0,
    isConnected, // Status de conexão SSE
  }
}
