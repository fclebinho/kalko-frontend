import { render, screen, waitFor } from '@testing-library/react'
import { PlanUsage } from '../plan-usage'

// Mock the API
vi.mock('@/lib/api', () => ({
  billingApi: {
    getSubscription: vi.fn(),
  },
}))

import { billingApi } from '@/lib/api'

describe('PlanUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders nothing while loading', () => {
    vi.mocked(billingApi.getSubscription).mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(<PlanUsage type="recipes" current={3} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows unlimited state correctly', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue({
      data: {
        plan: 'pro',
        status: 'active',
        planInfo: {
          limits: { recipes: Infinity, ingredients: Infinity },
        },
      },
    } as any)

    render(<PlanUsage type="recipes" current={15} />)

    await waitFor(() => {
      expect(screen.getByText(/Ilimitado/)).toBeInTheDocument()
    })
  })

  test('shows usage ratio for limited plan', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue({
      data: {
        plan: 'free',
        status: 'active',
        planInfo: {
          limits: { recipes: 5, ingredients: 20 },
        },
      },
    } as any)

    render(<PlanUsage type="recipes" current={3} />)

    await waitFor(() => {
      expect(screen.getByText('3 / 5')).toBeInTheDocument()
    })
  })

  test('shows warning when near limit (80%+)', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue({
      data: {
        plan: 'free',
        status: 'active',
        planInfo: {
          limits: { recipes: 5, ingredients: 20 },
        },
      },
    } as any)

    render(<PlanUsage type="recipes" current={4} />)

    await waitFor(() => {
      expect(screen.getByText(/próximo do limite/)).toBeInTheDocument()
    })
  })

  test('shows limit reached message and upgrade button', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue({
      data: {
        plan: 'free',
        status: 'active',
        planInfo: {
          limits: { recipes: 5, ingredients: 20 },
        },
      },
    } as any)

    render(<PlanUsage type="recipes" current={5} />)

    await waitFor(() => {
      expect(screen.getByText('Limite atingido')).toBeInTheDocument()
      expect(screen.getByText('Fazer Upgrade')).toBeInTheDocument()
    })
  })

  test('shows correct label for ingredients type', async () => {
    vi.mocked(billingApi.getSubscription).mockResolvedValue({
      data: {
        plan: 'free',
        status: 'active',
        planInfo: {
          limits: { recipes: 5, ingredients: 20 },
        },
      },
    } as any)

    render(<PlanUsage type="ingredients" current={10} />)

    await waitFor(() => {
      expect(screen.getByText('Ingredientes')).toBeInTheDocument()
      expect(screen.getByText('10 / 20')).toBeInTheDocument()
    })
  })

  test('handles API error gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(billingApi.getSubscription).mockRejectedValue(new Error('Network error'))

    const { container } = render(<PlanUsage type="recipes" current={3} />)

    // Wait for loading to finish; since it errors, subscription is null, should render null
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
