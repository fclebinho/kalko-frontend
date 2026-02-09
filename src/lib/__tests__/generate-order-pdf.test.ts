import { generateOrderPdf } from '../generate-order-pdf'

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 },
  }
  return {
    default: vi.fn(() => mockDoc),
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

describe('generateOrderPdf', () => {
  const defaultOptions = {
    items: [
      {
        recipeName: 'Bolo de Cenoura',
        quantity: 10,
        unitCost: 1.25,
        sellingPrice: 2.00,
        totalCost: 12.50,
        totalPrice: 20.00,
      },
    ],
    subtotalCost: 12.50,
    subtotalPrice: 20.00,
    discountType: 'percentage' as const,
    discountValue: 0,
    finalPrice: 20.00,
    finalProfit: 7.50,
    finalMargin: 37.5,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('generates order PDF without errors', () => {
    expect(() => generateOrderPdf(defaultOptions)).not.toThrow()
  })

  test('generates PDF with customer name', () => {
    expect(() =>
      generateOrderPdf({ ...defaultOptions, customerName: 'Maria Silva' })
    ).not.toThrow()
  })

  test('generates PDF with percentage discount', () => {
    expect(() =>
      generateOrderPdf({
        ...defaultOptions,
        discountType: 'percentage',
        discountValue: 10,
        finalPrice: 18.00,
        finalProfit: 5.50,
        finalMargin: 30.6,
      })
    ).not.toThrow()
  })

  test('generates PDF with fixed discount', () => {
    expect(() =>
      generateOrderPdf({
        ...defaultOptions,
        discountType: 'fixed',
        discountValue: 5,
        finalPrice: 15.00,
        finalProfit: 2.50,
        finalMargin: 16.7,
      })
    ).not.toThrow()
  })
})
