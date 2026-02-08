'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { dashboardApi, DashboardData } from '@/lib/api'
import { Package, ChefHat, DollarSign, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await dashboardApi.get()
      setData(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
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

  if (!data) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar dados do dashboard</AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">Receitas cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalIngredients}</div>
              <p className="text-xs text-muted-foreground">Ingredientes cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos Mensais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {data.summary.monthlyCosts.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total do mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo/Minuto</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {data.summary.costPerMinute.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">Custo operacional</p>
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
                          Custo: R$ {recipe.unitCost?.toFixed(2) || '0.00'}
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
                          R$ {recipe.unitCost?.toFixed(2)} → R${' '}
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
      </div>
    </>
  )
}
