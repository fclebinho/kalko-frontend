'use client'

import { Check } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Plan } from '@/lib/api'

interface PricingTableProps {
  plans: Plan[]
  currentPlan?: string
  onSelectPlan: (planId: string) => void
  loading?: string | null
}

export function PricingTable({ plans, currentPlan, onSelectPlan, loading }: PricingTableProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlan
        const isPopular = plan.id === 'pro'
        const isProcessing = loading === plan.id

        return (
          <Card
            key={plan.id}
            className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs text-primary-foreground font-medium">
                Mais Popular
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'Grátis' : `R$ ${(plan.price / 100).toFixed(0)}`}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : plan.id === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano Gratuito
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isProcessing || loading !== null}
                  variant={isPopular ? 'default' : 'outline'}
                >
                  {isProcessing ? 'Processando...' : 'Fazer Upgrade'}
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
