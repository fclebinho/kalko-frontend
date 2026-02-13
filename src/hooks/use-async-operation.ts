/**
 * Hook para executar operações assíncronas com tratamento automático de erros
 *
 * Single Responsibility: Gerencia execução assíncrona + feedback ao usuário
 * DRY: Elimina duplicação de try/catch + toast em cada handler
 * Dependency Inversion: Depende de abstrações (callbacks) não implementações
 *
 * @example
 * ```tsx
 * const { execute, isLoading } = useAsyncOperation()
 *
 * const handleSave = () => execute({
 *   operation: () => api.save(data),
 *   successMessage: 'Salvo com sucesso!',
 *   onSuccess: () => refetch(),
 *   onError: (error) => console.error(error)
 * })
 * ```
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface AsyncOperationOptions<T = unknown> {
  operation: () => Promise<T>
  successMessage?: string | ((result: T) => string)
  errorMessage?: string
  onSuccess?: (result: T) => void | Promise<void>
  onError?: (error: unknown) => void
  onFinally?: () => void
}

export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const execute = useCallback(async <T,>(options: AsyncOperationOptions<T>) => {
    const {
      operation,
      successMessage,
      errorMessage = 'Ocorreu um erro. Tente novamente.',
      onSuccess,
      onError,
      onFinally
    } = options

    try {
      setIsLoading(true)
      setError(null)

      const result = await operation()

      if (successMessage) {
        const message = typeof successMessage === 'function'
          ? successMessage(result)
          : successMessage
        toast.success(message)
      }

      if (onSuccess) {
        await onSuccess(result)
      }

      return result
    } catch (err: any) {
      setError(err)

      const message = err.response?.data?.message || errorMessage
      toast.error(message)

      if (onError) {
        onError(err)
      }

      throw err // Re-throw para permitir tratamento adicional se necessário
    } finally {
      setIsLoading(false)
      if (onFinally) {
        onFinally()
      }
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    execute,
    isLoading,
    error,
    reset
  }
}
