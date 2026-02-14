/**
 * SSE (Server-Sent Events) endpoint para notificações de recálculo em tempo real
 *
 * Faz polling no backend e envia updates para o cliente via SSE.
 * Mais seguro que expor WebSocket diretamente.
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://dev-backend:3001'
const POLL_INTERVAL = 2000 // Poll a cada 2 segundos

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true

      // Função para enviar evento SSE
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Polling loop
      const poll = async () => {
        while (isActive) {
          try {
            // Chamar backend para status de recálculo
            const response = await fetch(`${BACKEND_URL}/recipes/recalculation-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const data = await response.json()

              // Enviar update para cliente com status detalhado
              sendEvent({
                type: 'recalculation:update',
                payload: {
                  pending: data.pending,
                  calculating: data.calculating,
                  error: data.error,
                  total: data.total,
                  recipes: data.recipes, // Array com { id, name, status, lastCalculatedAt }
                  recipeIds: data.recipeIds,
                  completed: data.total === 0,
                }
              })
            } else {
              console.error('[SSE] Error fetching status:', response.status)
            }
          } catch (error) {
            console.error('[SSE] Polling error:', error)
          }

          // Aguardar antes do próximo poll
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
        }
      }

      // Iniciar polling
      poll().catch(err => {
        console.error('[SSE] Poll loop error:', err)
        controller.close()
      })

      // Cleanup quando cliente desconectar
      req.signal.addEventListener('abort', () => {
        console.log('[SSE] Client disconnected')
        isActive = false
        controller.close()
      })

      // Enviar keepalive a cada 30s para manter conexão viva
      const keepalive = setInterval(() => {
        if (isActive) {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } else {
          clearInterval(keepalive)
        }
      }, 30000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
