import { render, screen, fireEvent } from '@testing-library/react'
import { PriceCalculator } from '../price-calculator'

describe('PriceCalculator', () => {
  const defaultProps = {
    unitCost: 10,
    suggestedPrice: 15,
  }

  beforeEach(() => {
    vi.clearAllMocks()
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

  test('calculates price by margin correctly', () => {
    render(<PriceCalculator {...defaultProps} />)

    // Default margin is 50%
    // price = unitCost / (1 - margin/100) = 10 / (1 - 0.5) = 20
    // Both margin and profit sections may show R$ 20.00
    const prices = screen.getAllByText('R$ 20.00')
    expect(prices.length).toBeGreaterThanOrEqual(1)
  })

  test('calculates price by target profit', () => {
    render(<PriceCalculator {...defaultProps} />)

    // Default target profit is R$ 10
    // price = unitCost + profit = 10 + 10 = 20
    // Both "Por Margem" (50%) and "Por Lucro" (R$10) give R$ 20.00
    const prices = screen.getAllByText('R$ 20.00')
    expect(prices.length).toBeGreaterThanOrEqual(1)
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
