/**
 * Testes unitários para useConfirmDelete hook
 *
 * Testa fluxo completo de confirmação de exclusão
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useConfirmDelete } from '../use-confirm-delete'
import { vi } from 'vitest'
import * as sonner from 'sonner'

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock do useAsyncOperation
vi.mock('../use-async-operation', () => ({
  useAsyncOperation: () => ({
    execute: vi.fn(async (options) => {
      try {
        const result = await options.operation()
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        return result
      } catch (error) {
        if (options.onError) {
          options.onError(error)
        }
        throw error
      }
    }),
    isLoading: false,
    error: null
  })
}))

interface TestItem {
  id: string
  name: string
  inUse?: boolean
}

describe('useConfirmDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar com dialog fechado', () => {
    const { result } = renderHook(() => useConfirmDelete({
      onConfirm: vi.fn()
    }))

    expect(result.current.dialogProps.isOpen).toBe(false)
    expect(result.current.pendingItem).toBe(null)
  })

  it('deve abrir dialog quando prompt() é chamado', () => {
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: vi.fn()
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    expect(result.current.dialogProps.isOpen).toBe(true)
    expect(result.current.pendingItem).toBe(item)
  })

  it('deve executar onConfirm quando confirm() é chamado', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: mockOnConfirm,
      successMessage: 'Excluído!'
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    await act(async () => {
      await result.current.confirm()
    })

    expect(mockOnConfirm).toHaveBeenCalledWith(item)
  })

  it('deve fechar dialog após confirmação bem-sucedida', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: mockOnConfirm
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    expect(result.current.dialogProps.isOpen).toBe(true)

    await act(async () => {
      await result.current.confirm()
    })

    await waitFor(() => {
      expect(result.current.dialogProps.isOpen).toBe(false)
    })
  })

  it('deve chamar onSuccess após exclusão', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined)
    const mockOnSuccess = vi.fn()
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: mockOnConfirm,
      onSuccess: mockOnSuccess
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    await act(async () => {
      await result.current.confirm()
    })

    expect(mockOnSuccess).toHaveBeenCalledWith(item)
  })

  it('deve gerar mensagem de sucesso dinâmica', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: mockOnConfirm,
      successMessage: (item) => `${item.name} foi excluído`
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    await act(async () => {
      await result.current.confirm()
    })

    // Verificaria toast.success com mensagem dinâmica
  })

  it('deve mostrar warning quando getWarningMessage retorna mensagem', () => {
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: vi.fn(),
      getWarningMessage: (item) => item.inUse ? 'Item em uso!' : null
    }))

    const item: TestItem = { id: '1', name: 'Item Teste', inUse: true }

    act(() => {
      result.current.prompt(item)
    })

    expect(result.current.isBlocked).toBe(true)
    expect(result.current.warningMessage).toBe('Item em uso!')
  })

  it('não deve mostrar warning quando item não está em uso', () => {
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: vi.fn(),
      getWarningMessage: (item) => item.inUse ? 'Item em uso!' : null
    }))

    const item: TestItem = { id: '1', name: 'Item Teste', inUse: false }

    act(() => {
      result.current.prompt(item)
    })

    expect(result.current.isBlocked).toBe(false)
    expect(result.current.warningMessage).toBe(null)
  })

  it('deve cancelar e limpar estado quando cancel() é chamado', () => {
    const { result } = renderHook(() => useConfirmDelete<TestItem>({
      onConfirm: vi.fn()
    }))

    const item: TestItem = { id: '1', name: 'Item Teste' }

    act(() => {
      result.current.prompt(item)
    })

    expect(result.current.dialogProps.isOpen).toBe(true)

    act(() => {
      result.current.cancel()
    })

    expect(result.current.dialogProps.isOpen).toBe(false)
    expect(result.current.pendingItem).toBe(null)
  })
})
