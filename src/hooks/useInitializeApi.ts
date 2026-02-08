'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { setTokenGetter } from '@/lib/api'

/**
 * Hook para inicializar a API com o token do Clerk
 * Deve ser chamado uma vez no layout ou component raiz
 */
export function useInitializeApi() {
  const { getToken } = useAuth()

  useEffect(() => {
    // Configurar a função para pegar o token
    setTokenGetter(async () => {
      try {
        return await getToken()
      } catch (error) {
        console.error('Error getting Clerk token:', error)
        return null
      }
    })
  }, [getToken])
}
