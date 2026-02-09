'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { billingApi, Subscription } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle2, CreditCard, AlertTriangle, ChefHat, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPortal, setProcessingPortal] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelFeedback, setCancelFeedback] = useState('')
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadSubscription()

    // Verificar se veio de um checkout bem-sucedido
    if (searchParams?.get('success') === 'true') {
      toast.success('Upgrade realizado com sucesso!')
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

  async function handleCancelSubscription() {
    try {
      setCanceling(true)
      const response = await billingApi.cancelSubscription(cancelFeedback || undefined)
      toast.success(response.data.message || 'Assinatura cancelada')
      setCancelDialogOpen(false)
      setCancelFeedback('')
      loadSubscription()
    } catch (error: any) {
      console.error('Erro ao cancelar:', error)
      toast.error(error.response?.data?.error || 'Erro ao cancelar assinatura')
    } finally {
      setCanceling(false)
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
  const { usage } = subscription

  // Infinity is serialized as null in JSON
  const isUnlimited = (limit: number | null) => !limit || limit === null

  const recipesPercentage = isUnlimited(usage.recipes.limit)
    ? 0
    : Math.min(100, Math.round((usage.recipes.current / usage.recipes.limit) * 100))
  const ingredientsPercentage = isUnlimited(usage.ingredients.limit)
    ? 0
    : Math.min(100, Math.round((usage.ingredients.current / usage.ingredients.limit) * 100))

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-500'
    return 'text-primary'
  }

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
                  {subscription.status === 'active' ? 'Ativo' : `Status: ${subscription.status}`}
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

        {/* Uso do Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Uso do Plano</CardTitle>
            <CardDescription>
              Acompanhe o consumo dos recursos do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Receitas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Receitas</span>
                </div>
                <span className={`text-sm font-medium ${getProgressColor(recipesPercentage)}`}>
                  {usage.recipes.current}{isUnlimited(usage.recipes.limit) ? '' : ` / ${usage.recipes.limit}`}
                </span>
              </div>
              {isUnlimited(usage.recipes.limit) ? (
                <p className="text-xs text-muted-foreground">Ilimitado</p>
              ) : (
                <>
                  <Progress value={recipesPercentage} />
                  {recipesPercentage >= 80 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        {recipesPercentage >= 100
                          ? 'Limite atingido! Faça upgrade para criar mais receitas.'
                          : 'Você está se aproximando do limite.'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ingredientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Ingredientes</span>
                </div>
                <span className={`text-sm font-medium ${getProgressColor(ingredientsPercentage)}`}>
                  {usage.ingredients.current}{isUnlimited(usage.ingredients.limit) ? '' : ` / ${usage.ingredients.limit}`}
                </span>
              </div>
              {isUnlimited(usage.ingredients.limit) ? (
                <p className="text-xs text-muted-foreground">Ilimitado</p>
              ) : (
                <>
                  <Progress value={ingredientsPercentage} />
                  {ingredientsPercentage >= 80 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        {ingredientsPercentage >= 100
                          ? 'Limite atingido! Faça upgrade para adicionar mais ingredientes.'
                          : 'Você está se aproximando do limite.'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {!isPro && (recipesPercentage >= 80 || ingredientsPercentage >= 80) && (
              <Button
                className="w-full"
                onClick={() => router.push('/pricing')}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Fazer Upgrade
              </Button>
            )}
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
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={openCustomerPortal}
                  disabled={processingPortal}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {processingPortal ? 'Abrindo...' : 'Gerenciar Pagamento'}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancelar Assinatura
                </Button>
              </>
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
            <p>Você pode cancelar sua assinatura a qualquer momento</p>
            <p>Ao cancelar, você mantém acesso até o final do período pago</p>
            <p>Seus dados nunca são deletados, apenas seu acesso é limitado ao plano Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tem certeza que deseja cancelar sua assinatura <strong>{planName}</strong>?
                </p>
                <p>
                  Você manterá acesso aos recursos até o final do período atual
                  {subscription.currentPeriodEnd && (
                    <> ({format(new Date(subscription.currentPeriodEnd), "dd/MM/yyyy", { locale: ptBR })})</>
                  )}.
                  Após isso, seu plano será alterado para Free.
                </p>
                <div className="pt-2">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Conte-nos o motivo (opcional):
                  </p>
                  <Textarea
                    placeholder="O que podemos melhorar?"
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={canceling}>Manter Assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
