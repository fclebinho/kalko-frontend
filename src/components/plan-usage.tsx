'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { billingApi, Subscription } from '@/lib/api'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { AlertCircle, ArrowUp } from 'lucide-react'

interface PlanUsageProps {
  type: 'recipes' | 'ingredients'
  current: number
}

export function PlanUsage({ type, current }: PlanUsageProps) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      const response = await billingApi.getSubscription()
      setSubscription(response.data)
    } catch (error) {
      console.error('Erro ao carregar subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) {
    return null
  }

  const limit = subscription.planInfo.limits[type]
  const isUnlimited = limit === Infinity
  const percentage = isUnlimited ? 0 : (current / limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= limit

  // Se é ilimitado, não mostrar indicador
  if (isUnlimited) {
    return (
      <div className="text-sm text-muted-foreground">
        {type === 'recipes' ? 'Receitas' : 'Ingredientes'}: {current} (Ilimitado)
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {type === 'recipes' ? 'Receitas' : 'Ingredientes'}
        </span>
        <span className={isAtLimit ? 'text-destructive font-medium' : 'font-medium'}>
          {current} / {limit}
        </span>
      </div>

      <Progress
        value={percentage}
        className={`h-2 ${isAtLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-yellow-500/20' : ''}`}
      />

      {isNearLimit && !isAtLimit && (
        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>Você está próximo do limite do plano Free</span>
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-destructive" />
          <div className="flex-1 text-xs">
            <p className="font-medium text-destructive mb-1">Limite atingido</p>
            <p className="text-muted-foreground mb-2">
              Faça upgrade para continuar criando {type === 'recipes' ? 'receitas' : 'ingredientes'}.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => router.push('/pricing')}
            >
              <ArrowUp className="mr-1 h-3 w-3" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
