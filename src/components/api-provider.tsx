'use client'

import { ReactNode } from 'react'
import { useInitializeApi } from '@/hooks/useInitializeApi'

export function ApiProvider({ children }: { children: ReactNode }) {
  useInitializeApi()
  return <>{children}</>
}
