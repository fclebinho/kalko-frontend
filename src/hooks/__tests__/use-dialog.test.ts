/**
 * Testes unitários para useDialog hook
 *
 * Testa todas as funcionalidades do hook de gerenciamento de dialogs
 */

import { renderHook, act } from '@testing-library/react'
import { useDialog } from '../use-dialog'

describe('useDialog', () => {
  it('deve iniciar com isOpen = false por padrão', () => {
    const { result } = renderHook(() => useDialog())

    expect(result.current.isOpen).toBe(false)
  })

  it('deve iniciar com isOpen = true quando defaultOpen é true', () => {
    const { result } = renderHook(() => useDialog(true))

    expect(result.current.isOpen).toBe(true)
  })

  it('deve abrir o dialog quando open() é chamado', () => {
    const { result } = renderHook(() => useDialog())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('deve fechar o dialog quando close() é chamado', () => {
    const { result } = renderHook(() => useDialog(true))

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('deve alternar o estado quando toggle() é chamado', () => {
    const { result } = renderHook(() => useDialog())

    // Inicialmente fechado
    expect(result.current.isOpen).toBe(false)

    // Primeira toggle: abre
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    // Segunda toggle: fecha
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('deve permitir controle manual via setIsOpen', () => {
    const { result } = renderHook(() => useDialog())

    act(() => {
      result.current.setIsOpen(true)
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.setIsOpen(false)
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('deve manter callbacks estáveis (memoizados)', () => {
    const { result, rerender } = renderHook(() => useDialog())

    const firstOpen = result.current.open
    const firstClose = result.current.close
    const firstToggle = result.current.toggle

    // Força re-render
    rerender()

    // Callbacks devem ser as mesmas referências (memoizados)
    expect(result.current.open).toBe(firstOpen)
    expect(result.current.close).toBe(firstClose)
    expect(result.current.toggle).toBe(firstToggle)
  })
})
