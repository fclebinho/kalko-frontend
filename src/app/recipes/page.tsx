'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { recipesApi, Recipe } from '@/lib/api'
import { Plus, Search, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadRecipes()
  }, [search])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      const response = await recipesApi.list({ search })
      setRecipes(response.data.data)
    } catch (error) {
      toast.error('Erro ao carregar receitas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return

    try {
      await recipesApi.delete(id)
      toast.success('Receita excluída')
      loadRecipes()
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir receita'
      toast.error(message)
    }
  }

  const getMarginColor = (margin?: number | null) => {
    if (!margin) return ''
    if (margin < 0) return 'text-red-600'
    if (margin < 20) return 'text-orange-600'
    if (margin < 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Receitas</h1>
          <Link href="/recipes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Receita
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>Nenhuma receita encontrada</p>
                <Link href="/recipes/new">
                  <Button variant="link" className="mt-2">
                    Criar primeira receita
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Rendimento</TableHead>
                    <TableHead>Tempo Preparo</TableHead>
                    <TableHead>Custo Unitário</TableHead>
                    <TableHead>Preço Sugerido</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>{recipe.yield} un</TableCell>
                      <TableCell>{recipe.prepTime} min</TableCell>
                      <TableCell>
                        R$ {recipe.unitCost?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        R$ {recipe.suggestedPrice?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {recipe.sellingPrice
                          ? `R$ ${recipe.sellingPrice.toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {recipe.margin !== null && recipe.margin !== undefined ? (
                          <span className={`font-medium ${getMarginColor(recipe.margin)}`}>
                            {recipe.margin.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/recipes/${recipe.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(recipe.id, recipe.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
