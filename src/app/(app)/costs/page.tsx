'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { costsApi, FixedCost } from '@/lib/api'
import { Plus, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useCosts } from '@/hooks/use-costs'
import { useRecipesStore } from '@/stores/use-recipes-store'
import { useRecipeDetailStore } from '@/stores/use-recipe-detail-store'
import { useDashboardStore } from '@/stores/use-dashboard-store'

export default function CostsPage() {
  const { settings, isValidating, refetch, invalidate } = useCosts()
  const invalidateRecipes = useRecipesStore(state => state.invalidate)
  const invalidateRecipeDetails = useRecipeDetailStore(state => state.invalidate)
  const invalidateDashboard = useDashboardStore(state => state.clear)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'hours' | 'fixed' | 'variable'>('hours')
  const [formData, setFormData] = useState({
    monthlyHours: 0,
    name: '',
    amount: 0,
    month: new Date().toISOString().slice(0, 7)
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'fixed' | 'variable'; name: string } | null>(null)

  const handleOpenDialog = (type: 'hours' | 'fixed' | 'variable') => {
    setDialogType(type)
    if (type === 'hours' && settings) {
      setFormData({
        ...formData,
        monthlyHours: settings.monthlyHours
      })
    } else {
      setFormData({
        monthlyHours: 0,
        name: '',
        amount: 0,
        month: new Date().toISOString().slice(0, 7)
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (dialogType === 'hours') {
        await costsApi.updateHours(formData.monthlyHours)
        toast.success('Horas mensais atualizadas. Todas receitas foram recalculadas.')
      } else if (dialogType === 'fixed') {
        await costsApi.createFixedCost({
          name: formData.name,
          amount: formData.amount,
          month: formData.month
        })
        toast.success('Custo fixo adicionado. Receitas recalculadas.')
      } else {
        await costsApi.createVariableCost({
          name: formData.name,
          amount: formData.amount,
          month: formData.month
        })
        toast.success('Custo variável adicionado. Receitas recalculadas.')
      }
      setDialogOpen(false)
      // Invalidar TODOS os caches que dependem de receitas
      invalidate() // Custos
      invalidateRecipes() // Lista de receitas
      invalidateRecipeDetails() // Detalhes de receitas
      invalidateDashboard() // Dashboard
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar')
    }
  }

  const handleDeleteFixed = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'fixed', name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteVariable = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'variable', name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'fixed') {
        await costsApi.deleteFixedCost(deleteTarget.id)
      } else {
        await costsApi.deleteVariableCost(deleteTarget.id)
      }
      toast.success('Custo excluído. Receitas recalculadas.')
      // Invalidar TODOS os caches que dependem de receitas
      invalidate() // Custos
      invalidateRecipes() // Lista de receitas
      invalidateRecipeDetails() // Detalhes de receitas
      invalidateDashboard() // Dashboard
      refetch()
    } catch (error) {
      toast.error('Erro ao excluir')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Custos Operacionais" description="Configure custos fixos, variáveis e horas de trabalho" />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo/Minuto</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {settings?.costPerMinute.toFixed(3) || '0.000'}
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {settings?.costPerHour.toFixed(2) || '0.00'}/hora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {settings?.totalCosts.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Mensais</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {settings?.monthlyHours || 0}h
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => handleOpenDialog('hours')}
              >
                Atualizar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fixed Costs */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Custos Fixos</CardTitle>
                  <CardDescription>
                    Total: R$ {settings?.fixedCosts.total.toFixed(2) || '0.00'}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => handleOpenDialog('fixed')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {settings?.fixedCosts.items.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum custo fixo cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {settings?.fixedCosts.items.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex justify-between items-center p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{cost.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cost.month).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">R$ {cost.amount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFixed(cost.id, cost.name)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable Costs */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Custos Variáveis</CardTitle>
                  <CardDescription>
                    Total: R$ {settings?.variableCosts.total.toFixed(2) || '0.00'}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => handleOpenDialog('variable')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {settings?.variableCosts.items.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum custo variável cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {settings?.variableCosts.items.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex justify-between items-center p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{cost.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cost.month).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">R$ {cost.amount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVariable(cost.id, cost.name)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'hours'
                ? 'Atualizar Horas Mensais'
                : dialogType === 'fixed'
                ? 'Adicionar Custo Fixo'
                : 'Adicionar Custo Variável'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'hours'
                ? 'Informe quantas horas você trabalha por mês'
                : 'Adicione um novo custo ao mês atual'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {dialogType === 'hours' ? (
                <div>
                  <Label htmlFor="hours">Horas Mensais *</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={formData.monthlyHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyHours: parseFloat(e.target.value) || 0
                      })
                    }
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Exemplo: 160 horas (20 dias × 8 horas)
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={
                        dialogType === 'fixed' ? 'Ex: Aluguel, Internet' : 'Ex: Energia, Água'
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="month">Mês *</Label>
                    <Input
                      id="month"
                      type="month"
                      value={formData.month}
                      onChange={(e) =>
                        setFormData({ ...formData, month: e.target.value })
                      }
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.name}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
