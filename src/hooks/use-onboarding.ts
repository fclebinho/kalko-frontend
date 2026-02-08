'use client'

import { useState, useEffect } from 'react'
import { costsApi } from '@/lib/api'

export function useOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkOnboarding = async () => {
    try {
      setLoading(true)
      const response = await costsApi.getSettings()

      // Se não há configuração de horas ou está com valor padrão/zero
      const hasSettings = response.data && response.data.monthlyHours > 0
      setNeedsOnboarding(!hasSettings)
    } catch (error) {
      // Se der erro ao carregar, assumir que precisa de onboarding
      setNeedsOnboarding(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkOnboarding()
  }, [])

  const completeOnboarding = () => {
    setNeedsOnboarding(false)
  }

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    recheckOnboarding: checkOnboarding
  }
}
