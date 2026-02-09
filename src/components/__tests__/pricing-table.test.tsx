import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '../pricing-table'

const mockPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para começar',
    price: 0,
    features: ['5 receitas', '20 ingredientes'],
    limits: { recipes: 5, ingredients: 20 },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais',
    price: 2990,
    features: ['Receitas ilimitadas', 'Ingredientes ilimitados', 'Relatórios'],
    limits: { recipes: Infinity, ingredients: Infinity },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Para empresas',
    price: 5990,
    features: ['Tudo do Pro', 'Suporte prioritário'],
    limits: { recipes: Infinity, ingredients: Infinity },
  },
]

describe('PricingTable', () => {
  const defaultProps = {
    plans: mockPlans,
    onSelectPlan: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders all plans', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
  })

  test('renders plan descriptions', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('Para começar')).toBeInTheDocument()
    expect(screen.getByText('Para profissionais')).toBeInTheDocument()
  })

  test('renders price correctly (free vs paid)', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('Grátis')).toBeInTheDocument()
    expect(screen.getByText('R$ 30')).toBeInTheDocument() // 2990/100 = 29.9 -> 30
    expect(screen.getByText('R$ 60')).toBeInTheDocument() // 5990/100 = 59.9 -> 60
  })

  test('renders features for each plan', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('5 receitas')).toBeInTheDocument()
    expect(screen.getByText('Receitas ilimitadas')).toBeInTheDocument()
    expect(screen.getByText('Suporte prioritário')).toBeInTheDocument()
  })

  test('shows "Mais Popular" badge for pro plan', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('Mais Popular')).toBeInTheDocument()
  })

  test('shows "Plano Atual" for current plan', () => {
    render(<PricingTable {...defaultProps} currentPlan="pro" />)

    expect(screen.getByText('Plano Atual')).toBeInTheDocument()
  })

  test('disables free plan button', () => {
    render(<PricingTable {...defaultProps} />)

    expect(screen.getByText('Plano Gratuito')).toBeInTheDocument()
  })

  test('calls onSelectPlan when upgrade button clicked', () => {
    const onSelectPlan = vi.fn()
    render(<PricingTable {...defaultProps} onSelectPlan={onSelectPlan} loading={null} />)

    const upgradeButtons = screen.getAllByText('Fazer Upgrade')
    fireEvent.click(upgradeButtons[0])

    expect(onSelectPlan).toHaveBeenCalledTimes(1)
  })

  test('shows "Processando..." when loading a specific plan', () => {
    render(<PricingTable {...defaultProps} loading="pro" />)

    expect(screen.getByText('Processando...')).toBeInTheDocument()
  })
})
