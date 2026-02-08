'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Navigation } from '@/components/navigation'
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
import { recipesApi } from '@/lib/api'
import { ArrowLeft, Clock, Package, DollarSign, TrendingUp, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PriceCalculator } from '@/components/price-calculator'

interface RecipeDetails {
  id: string
  name: string
  description?: string
  prepTime: number
  yield: number
  totalCost?: number
  unitCost?: number
  suggestedPrice?: number
  sellingPrice?: number
  margin?: number
  ingredients: Array<{
    id: string
    ingredient: {
      id: string
      name: string
      unit: string
    }
    quantity: number
  }>
  calculations?: {
    breakdown: {
      ingredients: Array<{
        ingredientId: string
        name: string
        quantity: number
        unit: string
        costPerUnit: number
        totalCost: number
        percentage: number
      }>
      ingredientsCost: number
      laborCost: number
      laborCostPercentage: number
      totalCost: number
    }
    unitCost: number
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

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadRecipe()
    }
  }, [id])

  const loadRecipe = async () => {
    try {
      setLoading(true)
      const response = await recipesApi.get(id)
      setRecipe(response.data as RecipeDetails)
    } catch (error: any) {
      console.error('Erro ao carregar receita:', error)
      const message = error.response?.data?.error || error.message || 'Erro ao carregar receita'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

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

  const handleApplyPrice = async (price: number) => {
    try {
      await recipesApi.updatePrice(id, price)
      toast.success('Preço atualizado com sucesso!')
      loadRecipe() // Recarregar para ver os novos cálculos
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar preço')
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </div>
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Receita não encontrada</AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  const calculations = recipe.calculations
  const pieData = calculations ? [
    { name: 'Ingredientes', value: calculations.breakdown.ingredientsCost },
    { name: 'Mão de Obra', value: calculations.breakdown.laborCost }
  ] : []

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
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
          <h1 className="text-3xl font-bold mb-2">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Preparo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipe.prepTime} min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendimento</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipe.yield} un</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Unitário</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {recipe.unitCost?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sugerido: R$ {recipe.suggestedPrice?.toFixed(2) || '0.00'}
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
                    <span>Custo Unitário:</span>
                    <span className="font-medium">R$ {calculations.unitCost.toFixed(2)}</span>
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
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo/Un</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.breakdown.ingredients.map((ing) => (
                    <TableRow key={ing.ingredientId}>
                      <TableCell className="font-medium">
                        {ing.name}
                        {ing.name === calculations.mostExpensiveIngredient.name && (
                          <Badge className="ml-2" variant="secondary">Mais Caro</Badge>
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
              unitCost={calculations.unitCost}
              suggestedPrice={calculations.suggestedPrice}
              currentPrice={recipe.sellingPrice || undefined}
              onApplyPrice={handleApplyPrice}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/recipes/${id}/edit`)}>
            Editar Receita
          </Button>
          <Button variant="outline" onClick={() => router.push('/recipes')}>
            Voltar
          </Button>
        </div>
      </div>
    </>
  )
}
