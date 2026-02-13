/**
 * Testes unitários para useAsyncOperation hook
 *
 * Testa execução assíncrona com tratamento de erro e toast
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncOperation } from '../use-async-operation'
import { toast } from 'sonner'

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

describe('useAsyncOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve iniciar com isLoading = false e error = null', () => {
    const { result } = renderHook(() => useAsyncOperation())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('deve executar operação com sucesso e mostrar toast', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const mockOperation = jest.fn().mockResolvedValue('resultado')
    const mockOnSuccess = jest.fn()

    await act(async () => {
      await result.current.execute({
        operation: mockOperation,
        successMessage: 'Sucesso!',
        onSuccess: mockOnSuccess
      })
    })

    expect(mockOperation).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Sucesso!')
    expect(mockOnSuccess).toHaveBeenCalledWith('resultado')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('deve definir isLoading durante execução', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    let resolveOperation: (value: string) => void

    const mockOperation = jest.fn(() => new Promise<string>((resolve) => {
      resolveOperation = resolve
    }))

    act(() => {
      result.current.execute({
        operation: mockOperation
      })
    })

    // Durante execução
    expect(result.current.isLoading).toBe(true)

    // Resolve a operação
    await act(async () => {
      resolveOperation!('done')
    })

    // Após conclusão
    expect(result.current.isLoading).toBe(false)
  })

  it('deve tratar erros e mostrar toast de erro', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const mockError = new Error('Erro de teste')
    const mockOperation = jest.fn().mockRejectedValue(mockError)
    const mockOnError = jest.fn()

    await act(async () => {
      try {
        await result.current.execute({
          operation: mockOperation,
          errorMessage: 'Erro customizado',
          onError: mockOnError
        })
      } catch (error) {
        // Esperado
      }
    })

    expect(toast.error).toHaveBeenCalledWith('Erro customizado')
    expect(mockOnError).toHaveBeenCalledWith(mockError)
    expect(result.current.error).toBe(mockError)
    expect(result.current.isLoading).toBe(false)
  })

  it('deve usar mensagem de erro da resposta da API se disponível', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const apiError = {
      response: {
        data: {
          message: 'Erro da API'
        }
      }
    }
    const mockOperation = jest.fn().mockRejectedValue(apiError)

    await act(async () => {
      try {
        await result.current.execute({
          operation: mockOperation
        })
      } catch (error) {
        // Esperado
      }
    })

    expect(toast.error).toHaveBeenCalledWith('Erro da API')
  })

  it('deve chamar onFinally sempre, mesmo com erro', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const mockOnFinally = jest.fn()
    const mockOperation = jest.fn().mockRejectedValue(new Error('erro'))

    await act(async () => {
      try {
        await result.current.execute({
          operation: mockOperation,
          onFinally: mockOnFinally
        })
      } catch (error) {
        // Esperado
      }
    })

    expect(mockOnFinally).toHaveBeenCalled()
  })

  it('deve resetar estado quando reset() é chamado', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const mockOperation = jest.fn().mockRejectedValue(new Error('erro'))

    // Executa e gera erro
    await act(async () => {
      try {
        await result.current.execute({
          operation: mockOperation
        })
      } catch (error) {
        // Esperado
      }
    })

    expect(result.current.error).not.toBe(null)

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBe(null)
    expect(result.current.isLoading).toBe(false)
  })

  it('não deve mostrar toast de sucesso se successMessage não for fornecido', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    const mockOperation = jest.fn().mockResolvedValue('ok')

    await act(async () => {
      await result.current.execute({
        operation: mockOperation
        // Sem successMessage
      })
    })

    expect(toast.success).not.toHaveBeenCalled()
  })
})
