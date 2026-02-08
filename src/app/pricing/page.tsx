'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { billingApi, Plan } from '@/lib/api'
import { PricingTable } from '@/components/pricing-table'
import { toast } from 'sonner'

export default function PricingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        billingApi.getPlans(),
        billingApi.getSubscription().catch(() => null),
      ])

      setPlans(plansResponse.data.plans)
      if (subscriptionResponse) {
        setCurrentPlan(subscriptionResponse.data.plan)
      }
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectPlan(planId: string) {
    try {
      console.log('Iniciando checkout para plano:', planId)
      setProcessingPlan(planId)

      // Criar sessão de checkout
      console.log('Chamando billingApi.createCheckout...')
      const response = await billingApi.createCheckout(planId)
      console.log('Resposta recebida:', response)

      // Redirecionar para Stripe Checkout
      if (response.data.url) {
        console.log('Redirecionando para:', response.data.url)
        window.location.href = response.data.url
      } else {
        console.error('URL de checkout não retornada')
        toast.error('Erro: URL de checkout não disponível')
        setProcessingPlan(null)
      }
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error)
      console.error('Detalhes do erro:', error.response?.data || error.message)
      toast.error(`Erro ao processar upgrade: ${error.response?.data?.error || error.message}`)
      setProcessingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando planos...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comece gratuitamente e faça upgrade quando precisar de mais recursos.
          Cancele a qualquer momento.
        </p>
      </div>

      <PricingTable
        plans={plans}
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
        loading={processingPlan}
      />

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Todos os planos pagos incluem período de teste de 7 dias.</p>
        <p className="mt-2">
          Tem dúvidas? <a href="/contact" className="text-primary hover:underline">Entre em contato</a>
        </p>
      </div>
    </div>
  )
}
