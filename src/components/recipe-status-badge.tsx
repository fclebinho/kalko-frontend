/**
 * Badge para mostrar status de cálculo de receitas
 *
 * Estados:
 * - idle: Não mostra badge (estado padrão)
 * - pending: Aguardando processamento (amarelo)
 * - calculating: Calculando agora (azul animado)
 * - completed: Cálculo concluído (verde)
 * - error: Erro no cálculo (vermelho)
 */

import { Badge } from '@/components/ui/badge'
import { Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipeStatusBadgeProps {
  status: 'idle' | 'pending' | 'calculating' | 'completed' | 'error'
  className?: string
  showIdle?: boolean // Se true, mostra badge mesmo para 'idle'
}

export function RecipeStatusBadge({ status, className, showIdle = false }: RecipeStatusBadgeProps) {
  // Não mostra badge para 'idle' a menos que explicitamente solicitado
  if (status === 'idle' && !showIdle) {
    return null
  }

  const config = {
    idle: {
      label: 'Inativo',
      icon: null,
      variant: 'outline' as const,
      className: 'text-muted-foreground',
    },
    pending: {
      label: 'Pendente',
      icon: Clock,
      variant: 'outline' as const,
      className: 'text-yellow-600 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-950',
    },
    calculating: {
      label: 'Calculando',
      icon: Loader2,
      variant: 'outline' as const,
      className: 'text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-950 animate-pulse',
      iconClassName: 'animate-spin',
    },
    completed: {
      label: 'Atualizado',
      icon: CheckCircle2,
      variant: 'outline' as const,
      className: 'text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-600 dark:bg-green-950',
    },
    error: {
      label: 'Erro',
      icon: AlertCircle,
      variant: 'destructive' as const,
      className: '',
    },
  }

  const { label, icon: Icon, variant, className: statusClassName, iconClassName } = config[status]

  return (
    <Badge variant={variant} className={cn(statusClassName, className)}>
      {Icon && <Icon className={cn('h-3 w-3', iconClassName)} />}
      {label}
    </Badge>
  )
}
