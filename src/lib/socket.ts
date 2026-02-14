/**
 * Socket.IO Client Configuration
 *
 * Gerencia conexão WebSocket em tempo real com o backend
 */

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

interface RecalculationUpdate {
  pending: number
  recipeIds: string[]
  completed?: boolean
}

export function getSocket(token: string): Socket {
  if (!socket) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    socket = io(apiUrl, {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message)
    })

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnection attempt ${attempt}`)
    })

    socket.on('reconnect', (attempt) => {
      console.log(`[Socket] Reconnected after ${attempt} attempts`)
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[Socket] Manually disconnected')
  }
}

export function onRecalculationUpdate(
  callback: (data: RecalculationUpdate) => void
): () => void {
  if (!socket) {
    throw new Error('Socket not initialized. Call getSocket() first.')
  }

  socket.on('recalculation:update', callback)

  // Return cleanup function
  return () => {
    socket?.off('recalculation:update', callback)
  }
}
