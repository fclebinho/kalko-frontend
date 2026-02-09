import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Navigation } from '../navigation'

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders all navigation items', () => {
    render(<Navigation />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Ingredientes')).toBeInTheDocument()
    expect(screen.getByText('Receitas')).toBeInTheDocument()
    expect(screen.getByText('Custos')).toBeInTheDocument()
    expect(screen.getByText('Preços')).toBeInTheDocument()
    expect(screen.getByText('Pedidos')).toBeInTheDocument()
    expect(screen.getByText('Planos')).toBeInTheDocument()
    expect(screen.getByText('Assinatura')).toBeInTheDocument()
  })

  test('renders brand name', () => {
    render(<Navigation />)

    expect(screen.getByText('Precificação')).toBeInTheDocument()
  })

  test('renders UserButton', () => {
    render(<Navigation />)

    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })

  test('links point to correct hrefs', () => {
    render(<Navigation />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/ingredients')
    expect(hrefs).toContain('/recipes')
    expect(hrefs).toContain('/costs')
    expect(hrefs).toContain('/price-list')
    expect(hrefs).toContain('/orders')
    expect(hrefs).toContain('/pricing')
    expect(hrefs).toContain('/billing')
  })

  test('highlights active route', () => {
    vi.mocked(usePathname).mockReturnValue('/ingredients')
    render(<Navigation />)

    const ingredientesLink = screen.getByText('Ingredientes').closest('a')
    expect(ingredientesLink?.className).toContain('bg-primary')

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink?.className).not.toContain('bg-primary')
  })
})
