/**
 * Componente reutilizável de diálogo de confirmação de exclusão
 *
 * Single Responsibility: Apenas renderiza UI de confirmação
 * Open/Closed: Extensível via props sem modificar o componente
 * Interface Segregation: Props mínimas necessárias
 */

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

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  description?: string | React.ReactNode
  warningMessage?: string | null
  cancelText?: string
  confirmText?: string
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  warningMessage,
  cancelText = 'Cancelar',
  confirmText = 'Excluir'
}: ConfirmDeleteDialogProps) {
  const isBlocked = !!warningMessage

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || (isBlocked ? 'Não é possível excluir' : 'Confirmar Exclusão')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {warningMessage ? (
                <p className="text-destructive font-medium">{warningMessage}</p>
              ) : description ? (
                typeof description === 'string' ? (
                  <p>{description}</p>
                ) : (
                  description
                )
              ) : (
                <p>Esta ação não pode ser desfeita.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isBlocked ? (
            <AlertDialogCancel>Entendi</AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel disabled={isLoading}>
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Excluindo...' : confirmText}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
