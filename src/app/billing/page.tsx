'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { billingApi, Subscription } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle2, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPortal, setProcessingPortal] = useState(false)

  useEffect(() => {
    loadSubscription()

    // Verificar se veio de um checkout bem-sucedido
    if (searchParams?.get('success') === 'true') {
      toast.success('Upgrade realizado com sucesso! 🎉')
      // Limpar query params
      router.replace('/billing')
    }
  }, [searchParams])

  async function loadSubscription() {
    try {
      const response = await billingApi.getSubscription()
      setSubscription(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar subscription:', error)
      toast.error('Erro ao carregar informações de assinatura')
    } finally {
      setLoading(false)
    }
  }

  async function openCustomerPortal() {
    try {
      setProcessingPortal(true)
      const response = await billingApi.getPortalUrl()

      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error: any) {
      console.error('Erro ao abrir portal:', error)
      toast.error('Erro ao abrir portal de gerenciamento')
      setProcessingPortal(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
        </div>
      </div>
    )
  }

  const isPro = subscription.plan !== 'free'
  const planName = subscription.planInfo.name
  const planPrice = subscription.planInfo.price

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu plano e informações de pagamento
        </p>
      </div>

      <div className="grid gap-6">
        {/* Plano Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plano Atual</span>
              <span className="text-2xl font-bold text-primary">{planName}</span>
            </CardTitle>
            <CardDescription>
              {isPro ? (
                <span>
                  {subscription.status === 'active' ? '✓ Ativo' : `Status: ${subscription.status}`}
                </span>
              ) : (
                <span>Plano gratuito</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preço */}
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-medium">
                  {planPrice === 0 ? 'Grátis' : `R$ ${(planPrice / 100).toFixed(2)}/mês`}
                </span>
              </div>

              {/* Próxima cobrança */}
              {isPro && subscription.currentPeriodEnd && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Próxima cobrança</span>
                  <span className="font-medium">
                    {format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {/* Features do plano */}
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-2">Recursos incluídos:</p>
                <ul className="space-y-2">
                  {subscription.planInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>
              Atualize seu plano ou método de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPro && (
              <Button
                className="w-full"
                onClick={() => router.push('/pricing')}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Fazer Upgrade para Pro
              </Button>
            )}

            {isPro && subscription.stripeCustomerId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={openCustomerPortal}
                disabled={processingPortal}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {processingPortal ? 'Abrindo...' : 'Gerenciar Pagamento e Cancelar'}
              </Button>
            )}

            {!isPro && (
              <p className="text-xs text-center text-muted-foreground">
                Precisa de mais recursos? Confira nossos planos pagos!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Você pode cancelar sua assinatura a qualquer momento</p>
            <p>• Ao cancelar, você mantém acesso até o final do período pago</p>
            <p>• Seus dados nunca são deletados, apenas seu acesso é limitado ao plano Free</p>
            <p>
              • Precisa de ajuda? <a href="/support" className="text-primary hover:underline">Entre em contato</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="text-center">Carregando...</div></div>}>
      <BillingContent />
    </Suspense>
  )
}
