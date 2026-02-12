import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PriceCalculator } from '../price-calculator'
import { recipesApi } from '@/lib/api'

// Mock API
vi.mock('@/lib/api', () => ({
  recipesApi: {
    calculatePrice: vi.fn(),
  },
}))

describe('PriceCalculator', () => {
  const defaultProps = {
    unitCost: 10,
    suggestedPrice: 15,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da API retorna sempre valores calculados corretos
    ;(recipesApi.calculatePrice as any).mockResolvedValue({
      data: {
        sellingPrice: 20,
        profit: 10,
        margin: 50,
      },
    })
  })

  test('renders unit cost and suggested price', () => {
    render(<PriceCalculator {...defaultProps} />)

    expect(screen.getByText('R$ 10.00')).toBeInTheDocument()
    expect(screen.getByText('R$ 15.00')).toBeInTheDocument()
  })

  test('renders calculator title', () => {
    render(<PriceCalculator {...defaultProps} />)

    expect(screen.getByText('Calculadora de Preço')).toBeInTheDocument()
  })

  test('calculates price by margin correctly using backend API', async () => {
    render(<PriceCalculator {...defaultProps} />)

    // Aguardar a API ser chamada e o resultado ser exibido
    await waitFor(() => {
      expect(recipesApi.calculatePrice).toHaveBeenCalledWith({
        unitCost: 10,
        margin: 50,
      })
    })

    // O preço calculado deve aparecer após a API responder
    await waitFor(() => {
      const prices = screen.getAllByText('R$ 20.00')
      expect(prices.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('calculates price by target profit using backend API', async () => {
    render(<PriceCalculator {...defaultProps} />)

    // Aguardar a API ser chamada e o resultado ser exibido
    await waitFor(() => {
      expect(recipesApi.calculatePrice).toHaveBeenCalledWith({
        unitCost: 10,
        profit: 10,
      })
    })

    // O preço calculado deve aparecer após a API responder
    await waitFor(() => {
      const prices = screen.getAllByText('R$ 20.00')
      expect(prices.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('shows comparison section when currentPrice provided', () => {
    render(<PriceCalculator {...defaultProps} currentPrice={12} />)

    expect(screen.getByText('Comparação')).toBeInTheDocument()
    expect(screen.getByText('Preço Atual:')).toBeInTheDocument()
    expect(screen.getByText('R$ 12.00')).toBeInTheDocument()
  })

  test('calls onApplyPrice when Apply button is clicked', () => {
    const onApplyPrice = vi.fn()
    render(<PriceCalculator {...defaultProps} onApplyPrice={onApplyPrice} />)

    const applyButton = screen.getByText('Aplicar')
    fireEvent.click(applyButton)

    expect(onApplyPrice).toHaveBeenCalledTimes(1)
  })
})
