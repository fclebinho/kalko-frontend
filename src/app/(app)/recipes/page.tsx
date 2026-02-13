'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Plus, Eye, Trash2, Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { TablePagination } from '@/components/table-pagination'
import { useRecipes } from '@/hooks/use-recipes'

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { recipes, pagination, isValidating, deleteRecipe, refetch, invalidateAll } = useRecipes(search, page)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateTarget, setDuplicateTarget] = useState<{ id: string; name: string } | null>(null)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await deleteRecipe(deleteTarget.id, deleteTarget.name)
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleDuplicate = (id: string, name: string) => {
    setDuplicateTarget({ id, name })
    setDuplicateDialogOpen(true)
  }

  const confirmDuplicate = async () => {
    if (!duplicateTarget) return

    try {
      await recipesApi.duplicate(duplicateTarget.id)
      toast.success(`Receita "${duplicateTarget.name}" duplicada com sucesso`)
      invalidateAll()
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao duplicar receita')
    } finally {
      setDuplicateDialogOpen(false)
      setDuplicateTarget(null)
    }
  }

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true)
      const response = await recipesApi.recalculateAll()
      toast.success(`${response.data.count} receitas recalculadas com sucesso`)
      invalidateAll()
      refetch()
    } catch (error: any) {
      toast.error('Erro ao recalcular receitas')
    } finally {
      setRecalculating(false)
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
        <PageHeader title="Receitas" description="Crie e gerencie receitas com cálculo automático de custos">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRecalculateAll} disabled={recalculating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
              Recalcular Todas
            </Button>
            <Link href="/recipes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
            </Link>
          </div>
        </PageHeader>

        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome..." />

        <DataTable
          loading={isValidating}
          empty={recipes.length === 0}
          emptyMessage="Nenhuma receita encontrada"
          emptyAction={
            <Link href="/recipes/new">
              <Button variant="link" className="mt-2">
                Criar primeira receita
              </Button>
            </Link>
          }
        >
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Rendimento</TableHead>
                    <TableHead>Tempo Preparo</TableHead>
                    <TableHead>Custo</TableHead>
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
                      <TableCell>{recipe.yield} {recipe.yieldUnit || 'un'}</TableCell>
                      <TableCell>{recipe.prepTime} min</TableCell>
                      <TableCell>
                        R$ {(recipe.pricingCost ?? recipe.unitCost ?? 0).toFixed(2)}
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
                            <Button variant="ghost" size="icon" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicar"
                            onClick={() => handleDuplicate(recipe.id, recipe.name)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
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
        </DataTable>

        {pagination && (
          <TablePagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        )}

      {/* Duplicate Confirmation */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar receita</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja duplicar a receita &quot;{duplicateTarget?.name}&quot;? Uma cópia será criada com todos os ingredientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDuplicate}>
              Duplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.name}&quot;? Esta ação não pode ser desfeita.
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
