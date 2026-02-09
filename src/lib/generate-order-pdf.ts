import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface OrderItem {
  recipeName: string
  quantity: number
  unitCost: number
  sellingPrice: number
  totalCost: number
  totalPrice: number
}

interface OrderPdfOptions {
  items: OrderItem[]
  customerName?: string
  subtotalCost: number
  subtotalPrice: number
  discountType: 'percentage' | 'fixed'
  discountValue: number
  finalPrice: number
  finalProfit: number
  finalMargin: number
}

export function generateOrderPdf(options: OrderPdfOptions) {
  const {
    items,
    customerName,
    subtotalCost,
    subtotalPrice,
    discountType,
    discountValue,
    finalPrice,
    finalProfit,
    finalMargin,
  } = options

  const doc = new jsPDF()
  const date = new Date()

  // Header
  doc.setFontSize(18)
  doc.text('Orcamento de Pedido', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Data: ${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR')}`,
    14,
    30
  )

  if (customerName) {
    doc.text(`Cliente: ${customerName}`, 14, 36)
  }

  const startY = customerName ? 42 : 36

  // Items table (customer-visible)
  const tableData = items.map((item) => [
    item.recipeName,
    item.quantity.toString(),
    `R$ ${item.sellingPrice.toFixed(2)}`,
    `R$ ${item.totalPrice.toFixed(2)}`,
  ])

  autoTable(doc, {
    startY,
    head: [['Item', 'Qtd', 'Preco Un.', 'Total']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable?.finalY || 100

  // Totals section
  y += 10
  doc.setFontSize(10)
  doc.setTextColor(0)

  doc.text(`Subtotal:`, 120, y)
  doc.text(`R$ ${subtotalPrice.toFixed(2)}`, 160, y, { align: 'left' })

  if (discountValue > 0) {
    y += 7
    const discountLabel =
      discountType === 'percentage'
        ? `Desconto (${discountValue}%):`
        : `Desconto:`
    const discountAmount =
      discountType === 'percentage'
        ? subtotalPrice * (discountValue / 100)
        : discountValue
    doc.text(discountLabel, 120, y)
    doc.text(`- R$ ${discountAmount.toFixed(2)}`, 160, y, { align: 'left' })
  }

  y += 10
  doc.setFontSize(12)
  doc.setFont(undefined as any, 'bold')
  doc.text(`TOTAL:`, 120, y)
  doc.text(`R$ ${finalPrice.toFixed(2)}`, 160, y, { align: 'left' })

  // Internal section (cost analysis - not for customer)
  y += 20
  doc.setFontSize(8)
  doc.setFont(undefined as any, 'normal')
  doc.setTextColor(150)
  doc.text('--- Analise interna (nao enviar ao cliente) ---', 14, y)

  y += 7
  doc.setFontSize(9)
  doc.text(`Custo Total: R$ ${subtotalCost.toFixed(2)}`, 14, y)
  y += 6
  doc.text(`Lucro: R$ ${finalProfit.toFixed(2)}`, 14, y)
  y += 6
  doc.text(`Margem: ${finalMargin.toFixed(1)}%`, 14, y)

  doc.save(`orcamento-${date.toISOString().slice(0, 10)}.pdf`)
}
