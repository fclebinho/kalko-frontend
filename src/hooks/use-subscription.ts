'use client'

import { useEffect, useState, useCallback } from 'react'
import { billingApi, Subscription } from '@/lib/api'

// Global cache to avoid multiple fetches across components
let cachedSubscription: Subscription | null = null
let cachePromise: Promise<Subscription | null> | null = null

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(cachedSubscription)
  const [loading, setLoading] = useState(!cachedSubscription)

  useEffect(() => {
    if (cachedSubscription) return

    // Deduplicate concurrent requests
    if (!cachePromise) {
      cachePromise = billingApi
        .getSubscription()
        .then((res) => {
          cachedSubscription = res.data
          return res.data
        })
        .catch((error) => {
          console.error('Erro ao carregar subscription:', error)
          return null
        })
        .finally(() => {
          cachePromise = null
        })
    }

    cachePromise.then((data) => {
      setSubscription(data)
      setLoading(false)
    })
  }, [])

  const hasFeature = useCallback(
    (slug: string): boolean => {
      if (!subscription) return false
      return subscription.featureSlugs?.includes(slug) ?? false
    },
    [subscription]
  )

  const refresh = useCallback(async () => {
    cachedSubscription = null
    try {
      const res = await billingApi.getSubscription()
      cachedSubscription = res.data
      setSubscription(res.data)
    } catch (error) {
      console.error('Erro ao recarregar subscription:', error)
    }
  }, [])

  return { subscription, loading, hasFeature, refresh }
}
