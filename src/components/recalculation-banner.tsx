import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useRecalculationStatus } from '@/hooks/use-recalculation-status'
import { cn } from '@/lib/utils'

export function RecalculationBanner() {
  const { pending, calculating, error, total, isRecalculating } = useRecalculationStatus()

  if (!isRecalculating) {
    return null
  }

  const activeCount = pending + calculating

  return (
    <Alert className={cn(
      'mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
      error > 0 && 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
    )}>
      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Recalculando receitas
      </AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <span>
            {activeCount} receita{activeCount !== 1 ? 's' : ''} sendo processada{activeCount !== 1 ? 's' : ''}
          </span>
          {calculating > 0 && (
            <span className="text-xs opacity-75">
              ({calculating} calculando agora)
            </span>
          )}
          {error > 0 && (
            <span className="text-yellow-700 dark:text-yellow-300 text-xs">
              • {error} com erro
            </span>
          )}
        </div>
        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${total > 0 ? ((total - activeCount) / total) * 100 : 0}%`
            }}
          />
        </div>
      </AlertDescription>
    </Alert>
  )
}
