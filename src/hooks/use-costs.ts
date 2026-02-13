import { useEffect, useState } from 'react'
import { useCostsStore } from '@/stores/use-costs-store'
import { costsApi } from '@/lib/api'
import { toast } from 'sonner'

export function useCosts() {
  const { settings, isStale, setSettings, setError, invalidate } = useCostsStore()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!settings || isStale()) {
      fetchSettings()
    }
  }, [])

  const fetchSettings = async () => {
    try {
      if (!settings) setIsValidating(true)

      const response = await costsApi.getSettings()
      setSettings(response.data)
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar configurações')
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsValidating(false)
    }
  }

  return {
    settings,
    isValidating,
    refetch: fetchSettings,
    invalidate
  }
}
