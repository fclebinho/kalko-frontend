'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { dashboardApi, analyticsApi, DashboardData, TopIngredient } from '@/lib/api'
import { Package, ChefHat, DollarSign, TrendingUp, AlertCircle, AlertTriangle, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { toast } from 'sonner'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [topIngredients, setTopIngredients] = useState<TopIngredient[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [dashboardRes, ingredientsRes] = await Promise.all([
        dashboardApi.get(),
        analyticsApi.getTopIngredients().catch(() => ({ data: { data: [] } })),
      ])
      setData(dashboardRes.data)
      setTopIngredients(ingredientsRes.data.data)
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar dados do dashboard</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{greeting}, {user?.firstName || 'Usuario'}!</h1>
        <p className="text-muted-foreground mt-1">Aqui esta o resumo do seu negocio</p>
      </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <div className="text-2xl font-bold">{data.summary.totalRecipes}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingredientes</p>
                  <div className="text-2xl font-bold">{data.summary.totalIngredients}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custos Mensais</p>
                  <div className="text-2xl font-bold">
                    R$ {data.summary.monthlyCosts.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo/Minuto</p>
                  <div className="text-2xl font-bold">
                    R$ {data.summary.costPerMinute.toFixed(3)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Link href="/recipes" className="block hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-50 text-red-600 flex-shrink-0">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receitas em Prejuízo</p>
                    <div className="text-2xl font-bold text-red-600">
                      {data.summary.recipesWithLoss}
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Alertas</h2>
            <div className="space-y-2">
              {data.alerts.map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.type === 'error' ? 'destructive' : 'default'}
                >
                  {alert.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {alert.message}
                    {alert.recipeId && (
                      <Link
                        href={`/recipes/${alert.recipeId}`}
                        className="ml-2 underline"
                      >
                        Ver receita
                      </Link>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Receitas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentRecipes.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma receita cadastrada</p>
              ) : (
                <div className="space-y-4">
                  {data.recentRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex justify-between items-center">
                      <div>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="font-medium hover:underline"
                        >
                          {recipe.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          Custo: R$ {((recipe as any).yieldUnit && (recipe as any).yieldUnit !== 'un'
                            ? (recipe as any).totalCost
                            : recipe.unitCost
                          )?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      {recipe.margin !== null && recipe.margin !== undefined && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Margem: {recipe.margin.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Profitable */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Rentáveis</CardTitle>
            </CardHeader>
            <CardContent>
              {data.mostProfitable.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum produto com margem definida
                </p>
              ) : (
                <div className="space-y-4">
                  {data.mostProfitable.map((recipe) => (
                    <div key={recipe.id} className="flex justify-between items-center">
                      <div>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="font-medium hover:underline"
                        >
                          {recipe.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          R$ {((recipe as any).yieldUnit && (recipe as any).yieldUnit !== 'un'
                            ? (recipe as any).totalCost
                            : recipe.unitCost
                          )?.toFixed(2)} → R${' '}
                          {recipe.sellingPrice?.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {recipe.margin?.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Ingredients */}
        {topIngredients.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Ingredientes Mais Caros (Global)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topIngredients.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={((value: any) => [`R$ ${Number(value ?? 0).toFixed(2)}`, 'Custo total']) as any}
                      />
                      <Bar dataKey="totalCost" radius={[0, 4, 4, 0]}>
                        {topIngredients.slice(0, 8).map((_, index) => (
                          <Cell
                            key={index}
                            fill={index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#3b82f6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {topIngredients.slice(0, 5).map((item, index) => (
                    <div key={item.ingredientId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-5">
                          {index + 1}.
                        </span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.recipeCount} receita{item.recipeCount > 1 ? 's' : ''} · {item.percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">R$ {item.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </>
  )
}
