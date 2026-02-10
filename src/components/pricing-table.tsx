'use client'

import { useState } from 'react'
import { Check, CreditCard, QrCode } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Plan } from '@/lib/api'

interface PricingTableProps {
  plans: Plan[]
  currentPlan?: string
  onSelectPlan: (planId: string, gateway: 'stripe' | 'abacatepay') => void
  loading?: string | null
}

export function PricingTable({ plans, currentPlan, onSelectPlan, loading }: PricingTableProps) {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'abacatepay'>('stripe')

  return (
    <div className="space-y-6">
      {/* Seletor de Método de Pagamento */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Escolha o método de pagamento</CardTitle>
          <CardDescription>Selecione como deseja pagar sua assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedGateway}
            onValueChange={(v) => setSelectedGateway(v as 'stripe' | 'abacatepay')}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="stripe" id="stripe" className="peer sr-only" />
              <Label
                htmlFor="stripe"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <CreditCard className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Cartão de Crédito</p>
                  <p className="text-xs text-muted-foreground mt-1">Via Stripe (internacional)</p>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="abacatepay" id="abacatepay" className="peer sr-only" />
              <Label
                htmlFor="abacatepay"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <QrCode className="mb-3 h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">PIX</p>
                  <p className="text-xs text-muted-foreground mt-1">Via AbacatePay (Brasil)</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Grid de Planos */}
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
                  onClick={() => onSelectPlan(plan.id, selectedGateway)}
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
    </div>
  )
}
