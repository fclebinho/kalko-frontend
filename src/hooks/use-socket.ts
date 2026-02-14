/**
 * Hook para gerenciar conexão WebSocket com autenticação
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { Socket } from 'socket.io-client'

export function useSocket() {
  const { getToken, isSignedIn } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      // Desconectar se usuário não está autenticado
      if (socket) {
        disconnectSocket()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Conectar ao Socket.IO
    let mounted = true

    const connectSocket = async () => {
      try {
        const token = await getToken()

        if (!token || !mounted) return

        const socketInstance = getSocket(token)

        if (mounted) {
          setSocket(socketInstance)

          // Listen for connection status
          socketInstance.on('connect', () => {
            if (mounted) setIsConnected(true)
          })

          socketInstance.on('disconnect', () => {
            if (mounted) setIsConnected(false)
          })
        }
      } catch (error) {
        console.error('[useSocket] Failed to connect:', error)
      }
    }

    connectSocket()

    return () => {
      mounted = false
      // Não desconectar aqui - manter conexão ativa entre remontagens
    }
  }, [isSignedIn, getToken])

  return { socket, isConnected }
}
