'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { recipesApi } from '@/lib/api'
import { ArrowLeft, Clock, Package, DollarSign, TrendingUp, AlertCircle, AlertTriangle, CheckCircle, Trash2, Copy, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PriceCalculator } from '@/components/price-calculator'
import { PriceHistoryChart } from '@/components/price-history-chart'
import { useRecipeDetail } from '@/hooks/use-recipe-detail'
import { RecipeStatusBadge } from '@/components/recipe-status-badge'
// Cálculos centralizados no backend - não usar isWeightVolumeUnit

interface RecipeDetails {
  id: string
  name: string
  description?: string
  category?: string
  prepTime: number
  cookingTime?: number
  instructions?: string
  yield: number
  yieldUnit?: string
  totalCost?: number
  unitCost?: number
  pricingCost?: number
  suggestedPrice?: number
  sellingPrice?: number
  margin?: number
  calculationStatus: 'idle' | 'pending' | 'calculating' | 'completed' | 'error'
  lastCalculatedAt?: string
  ingredients: Array<{
    id: string
    ingredientId?: string
    subRecipeId?: string
    ingredient?: {
      id: string
      name: string
      unit: string
    }
    subRecipe?: {
      id: string
      name: string
      unitCost?: number
      yield: number
      yieldUnit?: string
    }
    quantity: number
  }>
  calculations?: {
    breakdown: {
      ingredients: Array<{
        ingredientId?: string
        subRecipeId?: string
        name: string
        quantity: number
        unit: string
        costPerUnit: number
        totalCost: number
        percentage: number
        isSubRecipe: boolean
        supplier?: string | null
        cheaperAlternative?: {
          supplier: string
          costPerUnit: number
          savingsPercent: number
        }
      }>
      ingredientsCost: number
      laborCost: number
      laborCostPercentage: number
      totalCost: number
    }
    unitCost: number
    pricingCost: number
    suggestedPrice: number
    sellingPrice?: number
    actualMargin?: number
    profit?: number
    mostExpensiveIngredient: {
      name: string
      totalCost: number
      percentage: number
    }
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

export default function RecipeDetailsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname?.split('/').pop() || ''

  const { recipe, isValidating, refetch } = useRecipeDetail(id)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const getMarginColor = (margin?: number) => {
    if (!margin) return 'default'
    if (margin < 0) return 'destructive'
    if (margin < 20) return 'destructive'
    if (margin < 30) return 'secondary'
    return 'default'
  }

  const getMarginIcon = (margin?: number) => {
    if (!margin || margin < 0) return <AlertCircle className="h-4 w-4" />
    if (margin < 20) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await recipesApi.delete(id)
      toast.success('Receita excluída com sucesso')
      router.push('/recipes')
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir receita'
      toast.error(message)
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleApplyPrice = async (price: number) => {
    try {
      await recipesApi.updatePrice(id, price)
      toast.success('Preço atualizado com sucesso!')
      refetch() // Recarregar para ver os novos cálculos
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar preço')
    }
  }

  const handleExportTechnicalSheet = async () => {
    try {
      toast.loading('Gerando ficha técnica...', { id: 'export-pdf' })
      const response = await recipesApi.exportTechnicalSheet(id)

      // Criar blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ficha-tecnica-${recipe?.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Ficha técnica exportada com sucesso!', { id: 'export-pdf' })
    } catch (error: any) {
      toast.error('Erro ao exportar ficha técnica', { id: 'export-pdf' })
      console.error('Export error:', error)
    }
  }

  if (!recipe) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Receita não encontrada</AlertDescription>
      </Alert>
    )
  }

  const calculations = recipe.calculations
  const pieData = calculations ? [
    { name: 'Ingredientes', value: calculations.breakdown.ingredientsCost },
    { name: 'Mão de Obra', value: calculations.breakdown.laborCost }
  ] : []

  return (
    <>
        <Button
          variant="ghost"
          onClick={() => router.push('/recipes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Receitas
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{recipe.name}</h1>
              <RecipeStatusBadge status={recipe.calculationStatus} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTechnicalSheet}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar Ficha Técnica
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            {recipe.description && (
              <p className="text-muted-foreground">{recipe.description}</p>
            )}
            {recipe.category && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Categoria:</span> {recipe.category}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Preparo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipe.prepTime} min</div>
              {recipe.cookingTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  + {recipe.cookingTime} min cozimento
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendimento</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipe.yield} {recipe.yieldUnit || 'un'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(calculations?.pricingCost ?? recipe.pricingCost ?? recipe.unitCost ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sugerido: R$ {(calculations?.suggestedPrice ?? recipe.suggestedPrice ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recipe.margin !== null && recipe.margin !== undefined ? (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {getMarginIcon(recipe.margin)}
                    <span className={
                      recipe.margin < 0 ? 'text-red-600' :
                      recipe.margin < 20 ? 'text-orange-600' :
                      recipe.margin < 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }>
                      {recipe.margin.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preço: R$ {recipe.sellingPrice?.toFixed(2) || '0.00'}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Não definido</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {calculations && (
          <div className="mb-8">
            {calculations.actualMargin !== undefined && calculations.actualMargin < 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>PREJUÍZO!</strong> O preço de venda está R$ {Math.abs(calculations.profit || 0).toFixed(2)} abaixo do custo.
                  Você perderá dinheiro em cada venda!
                </AlertDescription>
              </Alert>
            )}

            {calculations.actualMargin !== undefined && calculations.actualMargin >= 0 && calculations.actualMargin < 20 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Margem de {calculations.actualMargin.toFixed(1)}% está muito baixa. Recomendamos pelo menos 30%.
                </AlertDescription>
              </Alert>
            )}

            {calculations.actualMargin !== undefined && calculations.actualMargin >= 30 && (
              <Alert className="mb-4 border-green-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Excelente! Margem de {calculations.actualMargin.toFixed(1)}% está ótima.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Modo de Preparo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{recipe.instructions}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cost Breakdown Chart */}
          {calculations && (
            <Card>
              <CardHeader>
                <CardTitle>Composição de Custos</CardTitle>
                <CardDescription>Distribuição entre ingredientes e mão de obra</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${Number(value || 0).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ingredientes:</span>
                    <span className="font-medium">R$ {calculations.breakdown.ingredientsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mão de Obra ({recipe.prepTime} min):</span>
                    <span className="font-medium">R$ {calculations.breakdown.laborCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Custo Total:</span>
                    <span>R$ {calculations.breakdown.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Custo por {recipe.yieldUnit || 'un'}:</span>
                    <span className="font-medium">R$ {calculations.unitCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                    <span className="font-semibold">Custo para Precificação:</span>
                    <span className="font-bold text-blue-600">
                      R$ {(calculations.pricingCost ?? calculations.unitCost ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Most Expensive Ingredient */}
          {calculations && (
            <Card>
              <CardHeader>
                <CardTitle>Ingrediente Mais Caro</CardTitle>
                <CardDescription>Maior impacto no custo da receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {calculations.mostExpensiveIngredient.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xl font-semibold mb-2">
                    {calculations.mostExpensiveIngredient.name}
                  </div>
                  <div className="text-muted-foreground">
                    R$ {calculations.mostExpensiveIngredient.totalCost.toFixed(2)}
                  </div>
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este ingrediente representa {calculations.mostExpensiveIngredient.percentage.toFixed(1)}% do custo total.
                    Considere buscar fornecedores alternativos para reduzir custos.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ingredients Table */}
        {calculations && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detalhamento de Ingredientes</CardTitle>
              <CardDescription>Custo detalhado de cada ingrediente</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo/Un</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.breakdown.ingredients.map((ing: any, idx: number) => (
                    <TableRow key={ing.ingredientId || ing.subRecipeId || idx}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {ing.isSubRecipe && ing.subRecipeId ? (
                            <a
                              href={`/recipes/${ing.subRecipeId}`}
                              className="text-primary hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                router.push(`/recipes/${ing.subRecipeId}`)
                              }}
                            >
                              {ing.name}
                            </a>
                          ) : (
                            ing.name
                          )}
                          {ing.isSubRecipe && (
                            <Badge variant="outline" className="text-xs">Sub-receita</Badge>
                          )}
                          {ing.name === calculations.mostExpensiveIngredient.name && (
                            <Badge className="ml-1" variant="secondary">Mais Caro</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{ing.supplier || '-'}</span>
                        {ing.cheaperAlternative && (
                          <div className="text-xs text-green-600 mt-1">
                            Alternativa: {ing.cheaperAlternative.supplier} (economia de {ing.cheaperAlternative.savingsPercent}%)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {ing.quantity} {ing.unit}
                      </TableCell>
                      <TableCell>
                        R$ {ing.costPerUnit.toFixed(4)}/{ing.unit}
                      </TableCell>
                      <TableCell>R$ {ing.totalCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${ing.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm">{ing.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Price Calculator */}
        {calculations && (
          <div className="mb-8">
            <PriceCalculator
              unitCost={calculations.pricingCost}
              suggestedPrice={calculations.suggestedPrice}
              currentPrice={recipe.sellingPrice || undefined}
              onApplyPrice={handleApplyPrice}
            />
          </div>
        )}

        {/* Price History */}
        <div className="mb-8">
          <PriceHistoryChart
            entityType="recipe"
            entityId={id}
            title="Histórico de Custos e Preços"
            fields={['unitCost', 'totalCost', 'sellingPrice']}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/recipes/${id}/edit`)}>
            Editar Receita
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              const response = await recipesApi.duplicate(id)
              toast.success('Receita duplicada com sucesso')
              router.push(`/recipes/${(response.data as any).id}`)
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Erro ao duplicar receita')
            }
          }}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button variant="outline" onClick={() => router.push('/recipes')}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{recipe?.name}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
