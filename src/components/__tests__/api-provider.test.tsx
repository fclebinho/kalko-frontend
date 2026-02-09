import { render, screen } from '@testing-library/react'
import { ApiProvider } from '../api-provider'

vi.mock('@/hooks/useInitializeApi', () => ({
  useInitializeApi: vi.fn(),
}))

import { useInitializeApi } from '@/hooks/useInitializeApi'

describe('ApiProvider', () => {
  test('renders children', () => {
    render(
      <ApiProvider>
        <div data-testid="child">Hello</div>
      </ApiProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  test('calls useInitializeApi hook', () => {
    render(
      <ApiProvider>
        <div>Test</div>
      </ApiProvider>
    )

    expect(useInitializeApi).toHaveBeenCalled()
  })
})
