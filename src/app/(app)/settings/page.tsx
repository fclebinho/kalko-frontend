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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { billingApi, Subscription, settingsApi } from '@/lib/api'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { Bell, BellOff, ArrowRight, CheckCircle2, CreditCard, AlertTriangle, ChefHat, Package, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Settings state
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Billing state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)
  const [processingPortal, setProcessingPortal] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelFeedback, setCancelFeedback] = useState('')
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    // Load settings
    settingsApi
      .getEmailPreferences()
      .then((res) => setPriceAlerts(res.data.priceAlerts))
      .catch(() => {})
      .finally(() => setSettingsLoading(false))

    // Load subscription
    loadSubscription()

    // Checkout success redirect
    if (searchParams?.get('success') === 'true') {
      toast.success('Upgrade realizado com sucesso!')
      router.replace('/settings')
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
    setSaving(true)
    try {
      await settingsApi.updateEmailPreferences({ priceAlerts: newValue })
      setPriceAlerts(newValue)
      toast.success(newValue ? 'Alertas de preco ativados' : 'Alertas de preco desativados')
    } catch {
      toast.error('Erro ao atualizar preferencias')
    } finally {
      setSaving(false)
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

  async function handleReactivateSubscription() {
    try {
      setCanceling(true)
      const response = await billingApi.reactivateSubscription()
      toast.success(response.data.message || 'Assinatura reativada')
      loadSubscription()
    } catch (error: any) {
      console.error('Erro ao reativar:', error)
      toast.error(error.response?.data?.error || 'Erro ao reativar assinatura')
    } finally {
      setCanceling(false)
    }
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

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
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
                    disabled={saving}
                  >
                    {priceAlerts ? 'Ativado' : 'Desativado'}
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
                        onClick={() => router.push('/pricing')}
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

                      {subscription.cancelAtPeriodEnd ? (
                        <Button
                          className="w-full"
                          onClick={handleReactivateSubscription}
                          disabled={canceling}
                        >
                          {canceling ? 'Reativando...' : 'Reativar Assinatura'}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={() => setCancelDialogOpen(true)}
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
