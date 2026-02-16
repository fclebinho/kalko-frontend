'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save } from 'lucide-react'
import { adminApi, AdminFeature, AdminPlan } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface PlanFeatureState {
  enabled: boolean
  displayText: string
}

type PlanMatrix = Record<string, Record<string, PlanFeatureState>>

const PLAN_TYPES = ['free', 'pro', 'business'] as const
const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
}

export default function AdminPlansPage() {
  const [features, setFeatures] = useState<AdminFeature[]>([])
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [matrix, setMatrix] = useState<PlanMatrix>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [featRes, planRes] = await Promise.all([
        adminApi.getFeatures(),
        adminApi.getPlans(),
      ])

      const allFeatures = featRes.data.data
      const allPlans = planRes.data.plans

      setFeatures(allFeatures)
      setPlans(allPlans)

      // Build matrix from current plan-feature associations
      const newMatrix: PlanMatrix = {}
      for (const planType of PLAN_TYPES) {
        newMatrix[planType] = {}
        const plan = allPlans.find((p) => p.id === planType)

        for (const feature of allFeatures) {
          const linked = plan?.features.find((f) => f.featureId === feature.id)
          newMatrix[planType][feature.id] = {
            enabled: !!linked,
            displayText: linked?.displayText || '',
          }
        }
      }

      setMatrix(newMatrix)
      setHasChanges(false)
    } catch (err) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function toggleFeature(planType: string, featureId: string) {
    setMatrix((prev) => ({
      ...prev,
      [planType]: {
        ...prev[planType],
        [featureId]: {
          ...prev[planType][featureId],
          enabled: !prev[planType][featureId].enabled,
        },
      },
    }))
    setHasChanges(true)
  }

  function updateDisplayText(planType: string, featureId: string, text: string) {
    setMatrix((prev) => ({
      ...prev,
      [planType]: {
        ...prev[planType],
        [featureId]: {
          ...prev[planType][featureId],
          displayText: text,
        },
      },
    }))
    setHasChanges(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const planType of PLAN_TYPES) {
        const planFeatures = features
          .filter((f) => matrix[planType]?.[f.id]?.enabled)
          .map((f, index) => ({
            featureId: f.id,
            displayText: matrix[planType][f.id].displayText || undefined,
            sortOrder: index,
          }))

        await adminApi.setPlanFeatures(planType, planFeatures)
      }

      toast.success('Planos atualizados com sucesso')
      setHasChanges(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar planos')
    } finally {
      setSaving(false)
    }
  }

  function formatPrice(cents: number): string {
    if (cents === 0) return 'Gratis'
    return `R$ ${(cents / 100).toFixed(0)}/mes`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestor de Planos</h1>
          <p className="text-muted-foreground">
            Vincule e desvincule features de cada plano
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alteracoes
        </Button>
      </div>

      {/* Plan summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{formatPrice(plan.price)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {features.filter((f) => matrix[plan.id]?.[f.id]?.enabled).length > 0 ? (
                  <Badge variant="secondary">
                    {features.filter((f) => matrix[plan.id]?.[f.id]?.enabled).length} features
                  </Badge>
                ) : (
                  <Badge variant="outline">Sem features</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature-Plan Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz Feature x Plano</CardTitle>
          <CardDescription>
            Marque quais features pertencem a cada plano e defina o texto de exibicao
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] min-w-[200px]">Feature</TableHead>
                  {PLAN_TYPES.map((planType) => (
                    <TableHead key={planType} className="text-center min-w-[250px]">
                      <div className="font-semibold">{PLAN_LABELS[planType]}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          {feature.slug}
                        </span>
                      </div>
                      {feature.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {feature.category}
                        </Badge>
                      )}
                    </TableCell>
                    {PLAN_TYPES.map((planType) => {
                      const state = matrix[planType]?.[feature.id]
                      if (!state) return <TableCell key={planType} />

                      return (
                        <TableCell key={planType} className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.enabled}
                                onChange={() => toggleFeature(planType, feature.id)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">
                                {state.enabled ? 'Vinculado' : 'Desvinculado'}
                              </span>
                            </label>
                            {state.enabled && (
                              <Input
                                placeholder="Texto de exibicao"
                                value={state.displayText}
                                onChange={(e) =>
                                  updateDisplayText(planType, feature.id, e.target.value)
                                }
                                className="text-xs h-8 max-w-[200px]"
                              />
                            )}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                {features.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma feature cadastrada. Crie features primeiro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="shadow-lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alteracoes
          </Button>
        </div>
      )}
    </div>
  )
}
