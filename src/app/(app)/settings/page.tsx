'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { billingApi, Subscription, Plan, settingsApi } from '@/lib/api'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { PricingTable } from '@/components/pricing-table'
import { Bell, BellOff, ArrowRight, CheckCircle2, CreditCard, QrCode, AlertTriangle, ChefHat, Package, GraduationCap, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Tab state from URL
  const initialTab = searchParams?.get('tab') || 'geral'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Settings state
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Billing state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)
  const [cancelFeedback, setCancelFeedback] = useState('')

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  // 🎯 SOLID: Hooks reutilizáveis
  const cancelDialog = useDialog()
  const { execute: toggleAlerts, isLoading: isSavingAlerts } = useAsyncOperation()
  const { execute: openPortal, isLoading: isOpeningPortal } = useAsyncOperation()
  const { execute: cancelSubscription, isLoading: isCanceling } = useAsyncOperation()
  const { execute: reactivateSubscription, isLoading: isReactivating } = useAsyncOperation()

  useEffect(() => {
    // Load settings
    settingsApi
      .getEmailPreferences()
      .then((res) => setPriceAlerts(res.data.priceAlerts))
      .catch(() => {})
      .finally(() => setSettingsLoading(false))

    // Load subscription
    loadSubscription()

    // Load plans
    billingApi
      .getPlans()
      .then((res) => setPlans(res.data.plans))
      .catch(() => {})
      .finally(() => setPlansLoading(false))

    // Checkout success redirect
    if (searchParams?.get('success') === 'true') {
      toast.success('Upgrade realizado com sucesso!')
      router.replace('/settings?tab=assinatura')
    }
  }, [searchParams])

  async function loadSubscription() {
    try {
      const response = await billingApi.getSubscription()
      setSubscription(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar subscription:', error)
    } finally {
      setBillingLoading(false)
    }
  }

  const handleToggle = async () => {
    const newValue = !priceAlerts
    await toggleAlerts({
      operation: async () => {
        await settingsApi.updateEmailPreferences({ priceAlerts: newValue })
        return newValue
      },
      successMessage: newValue ? 'Alertas de preco ativados' : 'Alertas de preco desativados',
      errorMessage: 'Erro ao atualizar preferencias',
      onSuccess: (result) => {
        setPriceAlerts(result)
      }
    })
  }

  async function openCustomerPortal() {
    await openPortal({
      operation: async () => {
        const response = await billingApi.getPortalUrl()
        return response.data.url
      },
      errorMessage: 'Erro ao abrir portal de gerenciamento',
      onSuccess: (url) => {
        if (url) {
          window.location.href = url
        }
      }
    })
  }

  async function handleCancelSubscription() {
    await cancelSubscription({
      operation: async () => {
        const response = await billingApi.cancelSubscription(cancelFeedback || undefined)
        return response.data.message
      },
      successMessage: (message: string) => message || 'Assinatura cancelada',
      onSuccess: () => {
        cancelDialog.close()
        setCancelFeedback('')
        loadSubscription()
      }
    })
  }

  async function handleReactivateSubscription() {
    await reactivateSubscription({
      operation: async () => {
        const response = await billingApi.reactivateSubscription()
        return response.data.message
      },
      successMessage: (message: string) => message || 'Assinatura reativada',
      onSuccess: () => {
        loadSubscription()
      }
    })
  }

  async function handleSelectPlan(planId: string, gateway: 'stripe' | 'abacatepay') {
    try {
      setProcessingPlan(planId)
      const response = await billingApi.createCheckout(planId, gateway)
      if (response.data.url) {
        window.location.href = response.data.url
      } else {
        toast.error('Erro: URL de checkout não disponível')
        setProcessingPlan(null)
      }
    } catch (error: any) {
      toast.error(`Erro ao processar upgrade: ${error.response?.data?.error || error.message}`)
      setProcessingPlan(null)
    }
  }

  function handleTabChange(value: string) {
    setActiveTab(value)
    router.replace(`/settings?tab=${value}`, { scroll: false })
  }

  // Billing computed values
  const isPro = subscription ? subscription.plan !== 'free' : false
  const planName = subscription?.planInfo.name || ''
  const planPrice = subscription?.planInfo.price || 0
  const usage = subscription?.usage

  const isUnlimited = (limit: number | null) => !limit || limit === null

  const recipesPercentage = usage && !isUnlimited(usage.recipes.limit)
    ? Math.min(100, Math.round((usage.recipes.current / usage.recipes.limit) * 100))
    : 0
  const ingredientsPercentage = usage && !isUnlimited(usage.ingredients.limit)
    ? Math.min(100, Math.round((usage.ingredients.current / usage.ingredients.limit) * 100))
    : 0

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-orange-500'
    return 'text-primary'
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Configurações" description="Gerencie suas preferências e assinatura" />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="planos">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>

        {/* Tab Geral */}
        <TabsContent value="geral" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Email</CardTitle>
              <CardDescription>
                Controle quais notificacoes voce deseja receber por email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="text-muted-foreground text-sm">Carregando...</div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {priceAlerts ? (
                      <Bell className="h-5 w-5 text-primary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Alertas de Preco</p>
                      <p className="text-sm text-muted-foreground">
                        Receba email quando o custo de um ingrediente aumentar mais de 10%
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={priceAlerts ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleToggle}
                    disabled={isSavingAlerts}
                  >
                    {isSavingAlerts ? 'Salvando...' : priceAlerts ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tutorial</CardTitle>
              <CardDescription>
                Reveja a configuração inicial do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Configuração Inicial</p>
                    <p className="text-sm text-muted-foreground">
                      Reveja e atualize suas horas mensais de trabalho
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnboarding(true)}
                >
                  Rever Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>

          <OnboardingWizard
            open={showOnboarding}
            onComplete={() => setShowOnboarding(false)}
            allowClose
          />
        </TabsContent>

        {/* Tab Planos */}
        <TabsContent value="planos" className="mt-6">
          {plansLoading ? (
            <div className="text-center py-8">Carregando planos...</div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Escolha seu Plano</h2>
                <p className="text-muted-foreground">
                  Comece gratuitamente e faça upgrade quando precisar de mais recursos.
                </p>
              </div>

              <PricingTable
                plans={plans}
                currentPlan={subscription?.plan}
                onSelectPlan={handleSelectPlan}
                loading={processingPlan}
              />

              <p className="text-xs text-center text-muted-foreground">
                Todos os planos pagos incluem período de teste de 7 dias. Cancele a qualquer momento.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab Assinatura */}
        <TabsContent value="assinatura" className="mt-6">
          {billingLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : !subscription ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
            </div>
          ) : (
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
                      subscription.cancelAtPeriodEnd ? (
                        <span className="text-orange-500 font-medium">
                          Cancelamento agendado
                        </span>
                      ) : (
                        <span>
                          {subscription.status === 'active' ? 'Ativo' : `Status: ${subscription.status}`}
                        </span>
                      )
                    ) : (
                      <span>Plano gratuito</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Valor</span>
                      <span className="font-medium">
                        {planPrice === 0 ? 'Grátis' : `R$ ${(planPrice / 100).toFixed(2)}/mês`}
                      </span>
                    </div>

                    {isPro && subscription && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Método de Pagamento</span>
                        <span className="font-medium flex items-center gap-2">
                          {subscription.paymentGateway === 'stripe' && (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Cartão de Crédito
                            </>
                          )}
                          {subscription.paymentGateway === 'abacatepay' && (
                            <>
                              <QrCode className="h-4 w-4" />
                              PIX
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {isPro && subscription.currentPeriodEnd && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">
                          {subscription.cancelAtPeriodEnd ? 'Acesso até' : 'Próxima cobrança'}
                        </span>
                        <span className={`font-medium ${subscription.cancelAtPeriodEnd ? 'text-orange-500' : ''}`}>
                          {format(new Date(subscription.currentPeriodEnd), "dd 'de' MMMM, yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-orange-700">Cancelamento agendado</p>
                            <p className="text-orange-600 mt-1">
                              Sua assinatura será encerrada ao final do período atual. Você pode reativar a qualquer momento antes disso.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
              {usage && (!isUnlimited(usage.recipes.limit) || !isUnlimited(usage.ingredients.limit)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Uso do Plano</CardTitle>
                    <CardDescription>
                      Acompanhe o consumo dos recursos do seu plano
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChefHat className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Receitas</span>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(recipesPercentage)}`}>
                          {usage.recipes.current} / {usage.recipes.limit}
                        </span>
                      </div>
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
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Ingredientes</span>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(ingredientsPercentage)}`}>
                          {usage.ingredients.current} / {usage.ingredients.limit}
                        </span>
                      </div>
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
                    </div>

                    {(recipesPercentage >= 80 || ingredientsPercentage >= 80) && (
                      <Button
                        className="w-full"
                        onClick={() => handleTabChange('planos')}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Fazer Upgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Gerenciar */}
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
                      onClick={() => handleTabChange('planos')}
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
                        disabled={isOpeningPortal}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {isOpeningPortal ? 'Abrindo...' : 'Gerenciar Pagamento'}
                      </Button>

                      {subscription.cancelAtPeriodEnd ? (
                        <Button
                          className="w-full"
                          onClick={handleReactivateSubscription}
                          disabled={isReactivating}
                        >
                          {isReactivating ? 'Reativando...' : 'Reativar Assinatura'}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={cancelDialog.open}
                        >
                          Cancelar Assinatura
                        </Button>
                      )}
                    </>
                  )}

                  {!isPro && (
                    <p className="text-xs text-center text-muted-foreground">
                      Precisa de mais recursos? Confira nossos planos pagos!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Informações */}
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
          )}

          {/* Cancel Dialog */}
          {subscription && (
            <Dialog open={cancelDialog.isOpen} onOpenChange={cancelDialog.setIsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar Assinatura</DialogTitle>
                  <DialogDescription asChild>
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
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={cancelDialog.close} disabled={isCanceling}>
                    Manter Assinatura
                  </Button>
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    variant="destructive"
                  >
                    {isCanceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-center">Carregando...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
