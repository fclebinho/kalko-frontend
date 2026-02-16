'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Lock, ArrowUp } from 'lucide-react'
import { useSubscription } from '@/hooks/use-subscription'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

const FEATURE_LABELS: Record<string, { name: string; plan: string }> = {
  calculator: { name: 'Calculadora de Precos', plan: 'Pro' },
  reports: { name: 'Relatorios Avancados', plan: 'Pro' },
  profitability: { name: 'Analise de Lucratividade', plan: 'Pro' },
  api: { name: 'API de Integracao', plan: 'Business' },
  multiuser: { name: 'Multi-usuarios', plan: 'Business' },
  webhooks: { name: 'Webhooks Customizados', plan: 'Business' },
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, loading } = useSubscription()

  if (loading) return null

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const label = FEATURE_LABELS[feature] || { name: feature, plan: 'Pro' }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">{label.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Disponivel no plano {label.plan}
        </p>
        <Button asChild size="sm">
          <Link href="/settings?tab=planos">
            <ArrowUp className="h-4 w-4 mr-1" />
            Fazer Upgrade
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
