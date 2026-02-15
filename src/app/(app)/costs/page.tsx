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
import { costsApi, FixedCost } from '@/lib/api'
import { Plus, DollarSign, Clock, TrendingUp, Receipt } from 'lucide-react'
import { useCosts } from '@/hooks/use-costs'
import { useInvalidateRecipeCaches } from '@/hooks/use-invalidate-recipe-caches'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

export default function CostsPage() {
  const { settings, isValidating, refetch, invalidate } = useCosts()
  const invalidateRecipeCaches = useInvalidateRecipeCaches()

  // 🎯 SOLID: Uso de hooks reutilizáveis
  const formDialog = useDialog()
  const { execute: saveChanges, isLoading: isSaving } = useAsyncOperation()

  const [dialogType, setDialogType] = useState<'hours' | 'fixed' | 'variable'>('hours')
  const [formData, setFormData] = useState({
    monthlyHours: 0,
    taxRate: 0,
    name: '',
    amount: 0,
    month: new Date().toISOString().slice(0, 7)
  })

  // 🎯 DRY: Hook de confirmação de delete reutilizável
  const confirmDelete = useConfirmDelete<{ id: string; type: 'fixed' | 'variable'; name: string }>({
    onConfirm: async (item) => {
      if (item.type === 'fixed') {
        await costsApi.deleteFixedCost(item.id)
      } else {
        await costsApi.deleteVariableCost(item.id)
      }
    },
    successMessage: 'Custo excluído. Receitas recalculadas.',
    onSuccess: () => {
      invalidate()
      invalidateRecipeCaches()
      // Invalida novamente após 3s para pegar dados recalculados pelo worker
      setTimeout(() => invalidateRecipeCaches(), 3000)
      refetch()
    }
  })

  const handleOpenDialog = (type: 'hours' | 'fixed' | 'variable') => {
    setDialogType(type)
    if (type === 'hours' && settings) {
      setFormData({
        ...formData,
        monthlyHours: settings.monthlyHours,
        taxRate: settings.taxRate
      })
    } else {
      setFormData({
        monthlyHours: 0,
        taxRate: 0,
        name: '',
        amount: 0,
        month: new Date().toISOString().slice(0, 7)
      })
    }
    formDialog.open()
  }

  // 🎯 DRY: Operação assíncrona com toast automático
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const operations = {
      hours: {
        operation: () => costsApi.updateHours({
          monthlyHours: formData.monthlyHours,
          taxRate: formData.taxRate
        }),
        message: 'Configurações atualizadas. Todas receitas foram recalculadas.'
      },
      fixed: {
        operation: () => costsApi.createFixedCost({
          name: formData.name,
          amount: formData.amount,
          month: formData.month
        }),
        message: 'Custo fixo adicionado. Receitas recalculadas.'
      },
      variable: {
        operation: () => costsApi.createVariableCost({
          name: formData.name,
          amount: formData.amount,
          month: formData.month
        }),
        message: 'Custo variável adicionado. Receitas recalculadas.'
      }
    }

    const { operation, message } = operations[dialogType]

    await saveChanges({
      operation,
      successMessage: message,
      onSuccess: () => {
        formDialog.close()
        invalidate()
        invalidateRecipeCaches()
        refetch()
      }
    })
  }

  // 🎯 DRY: Handlers simplificados usando hook de delete
  const handleDeleteFixed = (id: string, name: string) => {
    confirmDelete.prompt({ id, type: 'fixed', name })
  }

  const handleDeleteVariable = (id: string, name: string) => {
    confirmDelete.prompt({ id, type: 'variable', name })
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Imposto</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {settings?.taxRate || 0}%
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
      <Dialog open={formDialog.isOpen} onOpenChange={formDialog.setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'hours'
                ? 'Configurações de Trabalho'
                : dialogType === 'fixed'
                ? 'Adicionar Custo Fixo'
                : 'Adicionar Custo Variável'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'hours'
                ? 'Configure horas mensais e taxa de imposto para cálculos precisos'
                : 'Adicione um novo custo ao mês atual'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {dialogType === 'hours' ? (
                <>
                  <div>
                    <Label htmlFor="hours">Horas Mensais *</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      max="744"
                      step="1"
                      value={formData.monthlyHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyHours: parseFloat(e.target.value) || 0
                        })
                      }
                      disabled={isSaving}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Exemplo: 160 horas (20 dias × 8 horas)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="taxRate">Taxa de Imposto (%) *</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.taxRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxRate: parseFloat(e.target.value) || 0
                        })
                      }
                      disabled={isSaving}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Percentual de imposto sobre o preço de venda (ex: 6.5 para 6.5%)
                    </p>
                  </div>
                </>
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
                      disabled={isSaving}
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
                      disabled={isSaving}
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
                      disabled={isSaving}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={formDialog.close}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🎯 DRY: Componente reutilizável de confirmação */}
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        description={confirmDelete.pendingItem && (
          <>Tem certeza que deseja excluir <strong>{confirmDelete.pendingItem.name}</strong>? Esta ação não pode ser desfeita.</>
        )}
      />
    </>
  )
}
