'use client'

import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, FileDown, Printer } from 'lucide-react'
import { useRecipeDetail } from '@/hooks/use-recipe-detail'
import { generateTechnicalSheetPDF } from '@/lib/generate-technical-sheet-pdf'
import { toast } from 'sonner'

export default function TechnicalSheetPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string || ''
  const { user } = useUser()

  const { recipe } = useRecipeDetail(id)

  const handleExportPDF = () => {
    if (!recipe || !recipe.calculations) {
      toast.error('Dados da receita não disponíveis')
      return
    }

    try {
      const data = {
        name: recipe.name,
        category: recipe.category,
        yield: recipe.yield,
        yieldUnit: recipe.yieldUnit || 'un',
        prepTime: recipe.prepTime,
        cookingTime: recipe.cookingTime,
        userName: user?.fullName || user?.firstName || undefined,
        instructions: recipe.instructions,
        ingredients: recipe.calculations.breakdown.ingredients,
        ingredientsCost: recipe.calculations.breakdown.ingredientsCost,
        laborCost: recipe.calculations.breakdown.laborCost,
        totalCost: recipe.calculations.breakdown.totalCost,
        unitCost: recipe.calculations.unitCost,
        sellingPrice: recipe.sellingPrice,
        margin: recipe.margin || undefined,
      }

      generateTechnicalSheetPDF(data)
      toast.success('Ficha técnica exportada com sucesso!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!recipe) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const calculations = recipe.calculations

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header - Hide on print */}
      <div className="mb-6 print:hidden">
        <Button
          variant="ghost"
          onClick={() => router.push(`/recipes/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Receita
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ficha Técnica</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Technical Sheet Content */}
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">FICHA TÉCNICA</CardTitle>
            <p className="text-xl font-semibold mt-2">{recipe.name}</p>
          </CardHeader>
        </Card>

        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>INFORMAÇÕES GERAIS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {recipe.category && (
                <div>
                  <span className="font-semibold">Categoria:</span> {recipe.category}
                </div>
              )}
              <div>
                <span className="font-semibold">Rendimento:</span> {recipe.yield} {recipe.yieldUnit || 'un'}
              </div>
              <div>
                <span className="font-semibold">Tempo de preparo:</span> {recipe.prepTime} min
              </div>
              {recipe.cookingTime && (
                <div>
                  <span className="font-semibold">Tempo de cozimento:</span> {recipe.cookingTime} min
                </div>
              )}
              {user?.fullName && (
                <div>
                  <span className="font-semibold">Responsável:</span> {user.fullName}
                </div>
              )}
              <div>
                <span className="font-semibold">Data:</span> {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        {calculations && (
          <Card>
            <CardHeader>
              <CardTitle>INGREDIENTES</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">% Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.breakdown.ingredients.map((ing: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {ing.isSubRecipe && '→ '}
                        {ing.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {ing.quantity} {ing.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {ing.costPerUnit.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        {ing.percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <Card>
            <CardHeader>
              <CardTitle>MODO DE PREPARO</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{recipe.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Cost Summary */}
        {calculations && (
          <Card>
            <CardHeader>
              <CardTitle>RESUMO DE CUSTOS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Custo de ingredientes:</span>
                  <span className="font-medium">R$ {calculations.breakdown.ingredientsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo de mão de obra:</span>
                  <span className="font-medium">R$ {calculations.breakdown.laborCost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Custo total:</span>
                  <span>R$ {calculations.breakdown.totalCost.toFixed(2)}</span>
                </div>
                {recipe.unitCost && (
                  <div className="flex justify-between">
                    <span>Custo unitário ({recipe.yieldUnit || 'un'}):</span>
                    <span className="font-medium">R$ {recipe.unitCost.toFixed(2)}</span>
                  </div>
                )}
                {recipe.sellingPrice && (
                  <>
                    <div className="flex justify-between mt-4">
                      <span>Preço de venda:</span>
                      <span className="font-medium">R$ {recipe.sellingPrice.toFixed(2)}</span>
                    </div>
                    {recipe.margin !== null && recipe.margin !== undefined && (
                      <div className="flex justify-between">
                        <span>Margem de lucro:</span>
                        <span className="font-medium">{recipe.margin.toFixed(1)}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground print:mt-8">
          <p>Gerado por Kalko.app em {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
