'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { costsApi } from '@/lib/api'
import { toast } from 'sonner'
import { Clock, CheckCircle } from 'lucide-react'

interface OnboardingWizardProps {
  open: boolean
  onComplete: () => void
  allowClose?: boolean
}

export function OnboardingWizard({ open, onComplete, allowClose }: OnboardingWizardProps) {
  const [monthlyHours, setMonthlyHours] = useState(160)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Pre-fill current hours when re-accessing
  useEffect(() => {
    if (open && allowClose) {
      setCompleted(false)
      costsApi
        .getSettings()
        .then(res => {
          if (res.data.monthlyHours) {
            setMonthlyHours(res.data.monthlyHours)
          }
        })
        .catch(() => {})
    }
  }, [open, allowClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      await costsApi.updateHours(monthlyHours)
      setCompleted(true)
      toast.success('Configuração inicial concluída!')

      // Aguardar um pouco antes de fechar para mostrar mensagem de sucesso
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar configuração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={allowClose ? onComplete : () => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (!allowClose) e.preventDefault() }}>
        {!completed ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">
                {allowClose ? 'Configuração Inicial' : 'Bem-vindo ao Sistema de Precificação!'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {allowClose
                  ? 'Revise e atualize suas horas mensais de trabalho.'
                  : 'Para calcular corretamente o custo das suas receitas, precisamos saber quantas horas você trabalha por mês.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyHours">Horas Mensais de Trabalho</Label>
                  <Input
                    id="monthlyHours"
                    type="number"
                    min="1"
                    value={monthlyHours}
                    onChange={(e) => setMonthlyHours(parseInt(e.target.value) || 160)}
                    required
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    Exemplo: 160 horas (20 dias úteis × 8 horas/dia)
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Por que isso é importante?</strong>
                    <br />
                    O tempo que você gasta preparando cada receita tem um custo. Com base nas suas horas mensais e custos operacionais, calculamos quanto vale cada minuto do seu trabalho.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Continuar'}
                </Button>
              </DialogFooter>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Você pode alterar essa configuração depois em Custos
              </p>
            </form>
          </>
        ) : (
          <div className="py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center mb-2">Tudo pronto!</DialogTitle>
            <DialogDescription className="text-center">
              Você já pode começar a criar suas receitas e calcular preços.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
