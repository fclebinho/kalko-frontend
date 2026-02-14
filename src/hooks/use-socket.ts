/**
 * Hook para gerenciar conexão WebSocket com autenticação
 */

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { Socket } from 'socket.io-client'

export function useSocket() {
  const { getToken, isSignedIn } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const previousSignedIn = useRef(isSignedIn)

  useEffect(() => {
    // Se usuário acabou de fazer logout, desconectar imediatamente
    if (previousSignedIn.current && !isSignedIn) {
      if (socket) {
        disconnectSocket()
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null)
        setIsConnected(false)
      }
    }

    previousSignedIn.current = isSignedIn

    // Se não está autenticado ou já tem socket, não fazer nada
    if (!isSignedIn || socket) return

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
    }
  }, [isSignedIn, socket, getToken])

  return { socket, isConnected }
}
