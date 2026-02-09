import { generatePriceListPdf } from '../generate-price-list-pdf'

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

describe('generatePriceListPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('generates PDF without errors', () => {
    const recipes = [
      {
        id: '1',
        name: 'Bolo de Cenoura',
        yield: 10,
        yieldUnit: 'un',
        prepTime: 45,
        unitCost: 1.25,
        totalCost: 12.50,
        sellingPrice: 2.00,
        margin: 37.5,
      },
    ] as any[]

    expect(() => generatePriceListPdf({ recipes })).not.toThrow()
  })

  test('generates PDF with empty recipes', () => {
    expect(() => generatePriceListPdf({ recipes: [] })).not.toThrow()
  })

  test('generates PDF with negative margin recipes', () => {
    const recipes = [
      {
        id: '1',
        name: 'Promo',
        yield: 10,
        yieldUnit: 'un',
        prepTime: 30,
        unitCost: 2.00,
        totalCost: 20.00,
        sellingPrice: 1.50,
        margin: -25,
      },
    ] as any[]

    expect(() => generatePriceListPdf({ recipes })).not.toThrow()
  })
})
