/**
 * Hook para gerenciar confirmação de exclusão com dialog
 *
 * Single Responsibility: Gerencia apenas fluxo de confirmação de exclusão
 * Open/Closed: Extensível via opções sem modificar o hook
 * DRY: Elimina duplicação de AlertDialog + estado em cada componente
 *
 * @example
 * ```tsx
 * const confirmDelete = useConfirmDelete({
 *   onConfirm: async (item) => {
 *     await api.delete(item.id)
 *   },
 *   successMessage: (item) => `${item.name} excluído`,
 *   getWarningMessage: (item) => item.usedInRecipes > 0
 *     ? `${item.name} está sendo usado`
 *     : null
 * })
 *
 * <Button onClick={() => confirmDelete.prompt(ingredient)}>Deletar</Button>
 * <ConfirmDeleteDialog {...confirmDelete.dialogProps} />
 * ```
 */

import { useState, useCallback } from 'react'
import { useAsyncOperation } from './use-async-operation'

interface ConfirmDeleteOptions<T> {
  onConfirm: (item: T) => Promise<void>
  successMessage?: string | ((item: T) => string)
  errorMessage?: string | ((item: T) => string)
  getWarningMessage?: (item: T) => string | null
  onSuccess?: (item: T) => void
}

export function useConfirmDelete<T = any>(options: ConfirmDeleteOptions<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingItem, setPendingItem] = useState<T | null>(null)
  const { execute, isLoading } = useAsyncOperation()

  const prompt = useCallback((item: T) => {
    setPendingItem(item)
    setIsOpen(true)
  }, [])

  const cancel = useCallback(() => {
    setIsOpen(false)
    setPendingItem(null)
  }, [])

  const confirm = useCallback(async () => {
    if (!pendingItem) return

    const successMsg = typeof options.successMessage === 'function'
      ? options.successMessage(pendingItem)
      : options.successMessage || 'Item excluído com sucesso'

    const errorMsg = typeof options.errorMessage === 'function'
      ? options.errorMessage(pendingItem)
      : options.errorMessage

    await execute({
      operation: () => options.onConfirm(pendingItem),
      successMessage: successMsg,
      errorMessage: errorMsg,
      onSuccess: () => {
        if (options.onSuccess) {
          options.onSuccess(pendingItem)
        }
        cancel()
      }
    })
  }, [pendingItem, options, execute, cancel])

  const warningMessage = pendingItem && options.getWarningMessage
    ? options.getWarningMessage(pendingItem)
    : null

  return {
    prompt,
    cancel,
    confirm,
    isLoading,
    pendingItem,
    isBlocked: !!warningMessage,
    warningMessage,
    dialogProps: {
      isOpen,
      onClose: cancel,
      onConfirm: confirm,
      isLoading,
      item: pendingItem,
      warningMessage
    }
  }
}
