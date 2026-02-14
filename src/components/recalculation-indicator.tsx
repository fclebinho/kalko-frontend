'use client'

/**
 * Indicador visual de recálculos em andamento
 *
 * Mostra um badge animado quando há receitas sendo recalculadas.
 * Faz polling automático e some quando completar.
 */

import { useRecalculationStatus } from '@/hooks/use-recalculation-status'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function RecalculationIndicator() {
  const { pending, isRecalculating } = useRecalculationStatus()
  const previousPending = useRef(pending)

  // Mostrar toast quando completar
  useEffect(() => {
    if (previousPending.current > 0 && pending === 0) {
      toast.success('✅ Recálculo concluído!', {
        description: 'Todas as receitas foram atualizadas',
        duration: 3000,
      })
    }
    previousPending.current = pending
  }, [pending])

  if (!isRecalculating) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            Recalculando {pending} {pending === 1 ? 'receita' : 'receitas'}...
          </span>
          <span className="text-xs opacity-80">
            Aguarde enquanto atualizamos os custos
          </span>
        </div>
      </div>
    </div>
  )
}
