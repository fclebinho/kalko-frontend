'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { SearchBar } from '@/components/search-bar'
import { DataTable } from '@/components/data-table'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { recipesApi, Recipe } from '@/lib/api'
import { ArrowUpDown, AlertCircle, AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { generatePriceListPdf } from '@/lib/generate-price-list-pdf'
import { toast } from 'sonner'
import Link from 'next/link'

type MarginFilter = 'all' | 'loss' | 'low' | 'good' | 'no-price'

export default function PriceListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [marginFilter, setMarginFilter] = useState<MarginFilter>('all')
  const [sortField, setSortField] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadRecipes()
  }, [search])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      const response = await recipesApi.list({ search, limit: 100 })
      setRecipes(response.data.data)
    } catch (error) {
      toast.error('Erro ao carregar receitas')
    } finally {
      setLoading(false)
    }
  }

  const getMarginBadge = (recipe: Recipe) => {
    if (!recipe.sellingPrice || recipe.margin === null || recipe.margin === undefined) {
      return <Badge variant="outline">Sem preço</Badge>
    }
    if (recipe.margin < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Prejuízo
        </Badge>
      )
    }
    if (recipe.margin < 20) {
      return (
        <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3" />
          Margem baixa
        </Badge>
      )
    }
    if (recipe.margin < 30) {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
          Margem ok
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Boa margem
      </Badge>
    )
  }

  const getDisplayCost = (recipe: Recipe) => {
    if (recipe.yieldUnit && recipe.yieldUnit !== 'un') {
      return recipe.totalCost ?? recipe.unitCost ?? 0
    }
    return recipe.unitCost ?? 0
  }

  const getCostLabel = (recipe: Recipe) => {
    if (recipe.yieldUnit && recipe.yieldUnit !== 'un') {
      return 'total'
    }
    return '/un'
  }

  const getProfit = (recipe: Recipe) => {
    if (!recipe.sellingPrice || !recipe.unitCost) return null
    return recipe.sellingPrice - recipe.unitCost
  }

  // Filter
  const filteredRecipes = recipes.filter(recipe => {
    if (marginFilter === 'all') return true
    if (marginFilter === 'no-price') return !recipe.sellingPrice
    if (marginFilter === 'loss') return recipe.margin !== null && recipe.margin !== undefined && recipe.margin < 0
    if (marginFilter === 'low') return recipe.margin !== null && recipe.margin !== undefined && recipe.margin >= 0 && recipe.margin < 20
    if (marginFilter === 'good') return recipe.margin !== null && recipe.margin !== undefined && recipe.margin >= 30
    return true
  })

  // Sort
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1
    if (sortField === 'name') return multiplier * a.name.localeCompare(b.name)
    if (sortField === 'cost') return multiplier * (getDisplayCost(a) - getDisplayCost(b))
    if (sortField === 'price') return multiplier * ((a.sellingPrice || 0) - (b.sellingPrice || 0))
    if (sortField === 'margin') return multiplier * ((a.margin || 0) - (b.margin || 0))
    return 0
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Resumo
  const totalRecipes = recipes.length
  const withPrice = recipes.filter(r => r.sellingPrice).length
  const withLoss = recipes.filter(r => r.margin !== null && r.margin !== undefined && r.margin < 0).length
  const withLowMargin = recipes.filter(r => r.margin !== null && r.margin !== undefined && r.margin >= 0 && r.margin < 20).length
  const avgMargin = recipes.filter(r => r.margin !== null && r.margin !== undefined).length > 0
    ? recipes.filter(r => r.margin !== null && r.margin !== undefined).reduce((sum, r) => sum + (r.margin || 0), 0) / recipes.filter(r => r.margin !== null && r.margin !== undefined).length
    : 0

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Lista de Preços" description="Visão consolidada de custos, preços e margens">
          <Button
            onClick={() => generatePriceListPdf({ recipes: sortedRecipes })}
            disabled={sortedRecipes.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </PageHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalRecipes}</div>
              <p className="text-sm text-muted-foreground">Total de produtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{withPrice}/{totalRecipes}</div>
              <p className="text-sm text-muted-foreground">Com preço definido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{avgMargin.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Margem média</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{withLoss + withLowMargin}</div>
              <p className="text-sm text-muted-foreground">Em alerta</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome...">
          <Select value={marginFilter} onValueChange={(v) => setMarginFilter(v as MarginFilter)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por margem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="loss">Prejuízo</SelectItem>
              <SelectItem value="low">Margem baixa (&lt;20%)</SelectItem>
              <SelectItem value="good">Boa margem (&gt;30%)</SelectItem>
              <SelectItem value="no-price">Sem preço</SelectItem>
            </SelectContent>
          </Select>
        </SearchBar>

        {/* Price List Table */}
        <DataTable
          loading={loading}
          empty={sortedRecipes.length === 0}
          emptyMessage="Nenhum produto encontrado"
        >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort('name')} className="gap-1 -ml-3">
                        Produto <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort('cost')} className="gap-1 -ml-3">
                        Custo <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort('price')} className="gap-1 -ml-3">
                        Preço Venda <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort('margin')} className="gap-1 -ml-3">
                        Margem <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecipes.map((recipe) => {
                    const profit = getProfit(recipe)
                    return (
                      <TableRow key={recipe.id} className={
                        recipe.margin !== null && recipe.margin !== undefined && recipe.margin < 0
                          ? 'bg-red-50'
                          : recipe.margin !== null && recipe.margin !== undefined && recipe.margin < 20
                            ? 'bg-orange-50'
                            : ''
                      }>
                        <TableCell>
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="font-medium hover:underline text-primary"
                          >
                            {recipe.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {recipe.yield} {recipe.yieldUnit || 'un'} | {recipe.prepTime} min
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            R$ {getDisplayCost(recipe).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">{getCostLabel(recipe)}</div>
                        </TableCell>
                        <TableCell>
                          {recipe.sellingPrice ? (
                            <div className="font-medium">R$ {recipe.sellingPrice.toFixed(2)}</div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {profit !== null ? (
                            <span className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              R$ {profit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {recipe.margin !== null && recipe.margin !== undefined ? (
                            <span className={`font-bold ${
                              recipe.margin < 0 ? 'text-red-600' :
                              recipe.margin < 20 ? 'text-orange-600' :
                              recipe.margin < 30 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {recipe.margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getMarginBadge(recipe)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
        </DataTable>
      </div>
    </>
  )
}
