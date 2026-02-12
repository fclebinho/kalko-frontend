import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Recipe } from '@/lib/api'

interface PdfOptions {
  recipes: Recipe[]
  title?: string
}

export function generatePriceListPdf({ recipes, title }: PdfOptions) {
  const doc = new jsPDF()
  const date = new Date()

  // Header
  doc.setFontSize(18)
  doc.text(title || 'Lista de Precos', 14, 22)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Gerado em: ${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR')}`,
    14,
    30
  )

  // Table data
  const tableData = recipes.map((recipe) => {
    const isWeightVolume = recipe.yieldUnit && recipe.yieldUnit !== 'un'
    const displayCost = isWeightVolume
      ? (recipe.totalCost ?? recipe.unitCost ?? 0)
      : (recipe.unitCost ?? 0)

    return [
      recipe.name,
      `${recipe.yield} ${recipe.yieldUnit || 'un'}`,
      `${recipe.prepTime} min`,
      `R$ ${displayCost.toFixed(2)}`,
      recipe.sellingPrice ? `R$ ${recipe.sellingPrice.toFixed(2)}` : '-',
      recipe.profit !== null && recipe.profit !== undefined ? `R$ ${recipe.profit.toFixed(2)}` : '-',
      recipe.margin !== null && recipe.margin !== undefined
        ? `${recipe.margin.toFixed(1)}%`
        : '-',
    ]
  })

  autoTable(doc, {
    startY: 36,
    head: [
      ['Produto', 'Rendimento', 'Preparo', 'Custo', 'Preco Venda', 'Lucro', 'Margem'],
    ],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const recipe = recipes[data.row.index]
        if (
          recipe?.margin !== null &&
          recipe?.margin !== undefined &&
          recipe.margin < 0
        ) {
          data.cell.styles.textColor = [220, 38, 38]
        }
      }
    },
  })

  // Summary footer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 200
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Total de produtos: ${recipes.length}`, 14, finalY + 10)

  const withPrice = recipes.filter((r) => r.sellingPrice).length
  doc.text(`Com preco definido: ${withPrice}/${recipes.length}`, 14, finalY + 16)

  const margins = recipes.filter(
    (r) => r.margin !== null && r.margin !== undefined
  )
  if (margins.length > 0) {
    const avg =
      margins.reduce((s, r) => s + (r.margin || 0), 0) / margins.length
    doc.text(`Margem media: ${avg.toFixed(1)}%`, 14, finalY + 22)
  }

  doc.save(`lista-precos-${date.toISOString().slice(0, 10)}.pdf`)
}
