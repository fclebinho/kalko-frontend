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
  calculating: number
  error: number
  total: number
  recipes: Array<{
    id: string
    name: string
    status: 'pending' | 'calculating' | 'error'
    lastCalculatedAt: string | null
  }>
  recipeIds: string[]
  completed?: boolean
}

export function useRecalculationStatus() {
  const [pending, setPending] = useState(0)
  const [calculating, setCalculating] = useState(0)
  const [error, setError] = useState(0)
  const [total, setTotal] = useState(0)
  const [recipes, setRecipes] = useState<RecalculationUpdate['recipes']>([])
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const previousTotalRef = useRef(0)

  // Fetch inicial ao montar
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await recipesApi.recalculationStatus()
        const data = response.data

        setPending(data.pending)
        setCalculating(data.calculating || 0)
        setError(data.error || 0)
        setTotal(data.total || data.pending)
        setRecipes(data.recipes || [])
        setRecipeIds(data.recipeIds)
        previousTotalRef.current = data.total || data.pending
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

          // Atualizar estados
          setPending(data.pending)
          setCalculating(data.calculating)
          setError(data.error)
          setTotal(data.total)
          setRecipes(data.recipes)
          setRecipeIds(data.recipeIds)

          // Detectar quando receitas completam (total diminuiu)
          if (previousTotalRef.current > 0 && data.total < previousTotalRef.current) {
            console.log('[RecalculationStatus] Recipes completed, cache should be invalidated')
            // Cache invalidation será feito pelo componente que usa este hook
          }

          previousTotalRef.current = data.total
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
    calculating,
    error,
    total,
    recipes,
    recipeIds,
    isRecalculating: total > 0,
    isConnected, // Status de conexão SSE
  }
}
