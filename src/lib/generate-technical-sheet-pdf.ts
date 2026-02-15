import jsPDF from 'jspdf'

interface TechnicalSheetIngredient {
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  totalCost: number
  percentage: number
  isSubRecipe: boolean
}

interface TechnicalSheetData {
  name: string
  category?: string
  yield: number
  yieldUnit: string
  prepTime: number
  cookingTime?: number
  userName?: string
  instructions?: string
  ingredients: TechnicalSheetIngredient[]
  ingredientsCost: number
  laborCost: number
  totalCost: number
  unitCost: number
  sellingPrice?: number
  margin?: number
}

// Helper function to remove accents
const removeAccents = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function generateTechnicalSheetPDF(data: TechnicalSheetData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let yPos = 20

  // ===== CABEÇALHO =====
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FICHA TECNICA', 105, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(removeAccents(data.name), 105, yPos, { align: 'center' })
  yPos += 15

  // ===== INFORMAÇÕES GERAIS =====
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACOES GERAIS', 20, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Coluna esquerda
  if (data.category) {
    doc.text(`Categoria: ${removeAccents(data.category)}`, 20, yPos)
  }
  doc.text(`Rendimento: ${data.yield} ${removeAccents(data.yieldUnit)}`, 20, yPos + 5)
  doc.text(`Tempo de preparo: ${data.prepTime} min`, 20, yPos + 10)

  // Coluna direita
  const rightCol = 120
  if (data.cookingTime) {
    doc.text(`Tempo de cozimento: ${data.cookingTime} min`, rightCol, yPos)
  }
  if (data.userName) {
    doc.text(`Responsavel: ${removeAccents(data.userName)}`, rightCol, yPos + 5)
  }
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, rightCol, yPos + 10)

  yPos += 20

  // ===== INGREDIENTES =====
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INGREDIENTES', 20, yPos)
  yPos += 7

  // Cabeçalho da tabela
  doc.setFontSize(9)
  doc.text('Ingrediente', 20, yPos)
  doc.text('Quantidade', 120, yPos, { align: 'right' })
  doc.text('Custo Unit.', 150, yPos, { align: 'right' })
  doc.text('% Custo', 180, yPos, { align: 'right' })

  // Linha abaixo do cabeçalho
  doc.line(20, yPos + 1, 190, yPos + 1)
  yPos += 6

  doc.setFont('helvetica', 'normal')

  // Linhas de ingredientes
  for (const ing of data.ingredients) {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }

    const name = ing.isSubRecipe ? `-> ${removeAccents(ing.name)}` : removeAccents(ing.name)
    doc.text(name.substring(0, 40), 20, yPos)
    doc.text(`${ing.quantity} ${removeAccents(ing.unit)}`, 120, yPos, { align: 'right' })
    doc.text(`R$ ${ing.costPerUnit.toFixed(4)}`, 150, yPos, { align: 'right' })
    doc.text(`${ing.percentage.toFixed(1)}%`, 180, yPos, { align: 'right' })

    yPos += 5
  }

  yPos += 10

  // ===== MODO DE PREPARO =====
  if (data.instructions) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('MODO DE PREPARO', 20, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Quebrar texto em linhas
    const lines = doc.splitTextToSize(removeAccents(data.instructions), 170)
    doc.text(lines, 20, yPos)
    yPos += lines.length * 5 + 10
  }

  // ===== RESUMO DE CUSTOS =====
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO DE CUSTOS', 20, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  doc.text('Custo de ingredientes:', 20, yPos)
  doc.text(`R$ ${data.ingredientsCost.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 5

  doc.text('Custo de mao de obra:', 20, yPos)
  doc.text(`R$ ${data.laborCost.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 5

  doc.line(20, yPos, 190, yPos)
  yPos += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Custo total:', 20, yPos)
  doc.text(`R$ ${data.totalCost.toFixed(2)}`, 180, yPos, { align: 'right' })
  yPos += 5

  if (data.unitCost) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Custo unitario (${data.yieldUnit}):`, 20, yPos)
    doc.text(`R$ ${data.unitCost.toFixed(2)}`, 180, yPos, { align: 'right' })
    yPos += 5
  }

  // Preço de venda e margem
  if (data.sellingPrice) {
    yPos += 5
    doc.text('Preco de venda:', 20, yPos)
    doc.text(`R$ ${data.sellingPrice.toFixed(2)}`, 180, yPos, { align: 'right' })
    yPos += 5

    if (data.margin) {
      doc.text('Margem de lucro:', 20, yPos)
      doc.text(`${data.margin.toFixed(1)}%`, 180, yPos, { align: 'right' })
    }
  }

  // ===== RODAPÉ =====
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    const dateStr = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
    doc.text(`Gerado por Kalko.app em ${dateStr}`, 105, 287, { align: 'center' })
  }

  // Salvar PDF
  doc.save(`ficha-tecnica-${removeAccents(data.name).toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`)
}
