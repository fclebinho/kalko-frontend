import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/stores/use-dashboard-store'
import { dashboardApi, analyticsApi } from '@/lib/api'

export function useDashboard() {
  const { dashboard, topIngredients, isStale, setDashboard, setError } = useDashboardStore()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!dashboard || isStale()) {
      fetchDashboard()
    }
  }, [])

  const fetchDashboard = async () => {
    try {
      if (!dashboard) setIsValidating(true)

      const [dashboardRes, ingredientsRes] = await Promise.all([
        dashboardApi.get(),
        analyticsApi.getTopIngredients().catch(() => ({ data: { data: [] } }))
      ])

      setDashboard(dashboardRes.data, ingredientsRes.data.data)
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar dashboard')
    } finally {
      setIsValidating(false)
    }
  }

  return {
    data: dashboard,
    topIngredients,
    isValidating,
    refetch: fetchDashboard
  }
}
