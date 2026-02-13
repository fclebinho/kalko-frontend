/**
 * Hook reutilizável para gerenciar estado de dialogs
 *
 * Single Responsibility: Gerencia apenas estado de abertura/fechamento
 * DRY: Evita duplicação de useState(false) + handlers em cada componente
 *
 * @example
 * ```tsx
 * const dialog = useDialog()
 *
 * <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
 *   <Button onClick={dialog.open}>Abrir</Button>
 *   <Button onClick={dialog.close}>Fechar</Button>
 * </Dialog>
 * ```
 */

import { useState, useCallback } from 'react'

export function useDialog(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle
  }
}
