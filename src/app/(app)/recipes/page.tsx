'use client'

import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { recipesApi, Recipe } from '@/lib/api'
import { Plus, Eye, Trash2, Copy, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { TablePagination } from '@/components/table-pagination'
import { useRecipes } from '@/hooks/use-recipes'
import { useInvalidateRecipeCaches } from '@/hooks/use-invalidate-recipe-caches'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

export default function RecipesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { recipes, pagination, isValidating, refetch, invalidateAll } = useRecipes(search, page)
  const invalidateRecipeCaches = useInvalidateRecipeCaches()

  // 🎯 SOLID: Hooks reutilizáveis
  const duplicateDialog = useDialog()
  const { execute: recalculateAll, isLoading: isRecalculating } = useAsyncOperation()
  const { execute: duplicateRecipe, isLoading: isDuplicating } = useAsyncOperation()

  // 🎯 SOLID: Hook para confirmação de delete
  const confirmDelete = useConfirmDelete<Recipe>({
    onConfirm: async (recipe) => {
      await recipesApi.delete(recipe.id)
    },
    successMessage: (recipe) => `${recipe.name} excluída com sucesso`,
    onSuccess: () => {
      invalidateAll()
      refetch()
    }
  })

  const [duplicateTarget, setDuplicateTarget] = useState<{ id: string; name: string } | null>(null)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDuplicate = (id: string, name: string) => {
    setDuplicateTarget({ id, name })
    duplicateDialog.open()
  }

  const confirmDuplicate = async () => {
    if (!duplicateTarget) return

    await duplicateRecipe({
      operation: async () => {
        await recipesApi.duplicate(duplicateTarget.id)
        return duplicateTarget
      },
      successMessage: `Receita "${duplicateTarget.name}" duplicada com sucesso`,
      onSuccess: () => {
        invalidateAll()
        invalidateRecipeCaches()
        refetch()
        duplicateDialog.close()
        setDuplicateTarget(null)
      },
      onError: () => {
        // Mantém dialog aberto em caso de erro
      }
    })
  }

  const handleRecalculateAll = async () => {
    await recalculateAll({
      operation: async () => {
        const response = await recipesApi.recalculateAll()
        return response.data.count
      },
      successMessage: (count: number) => `${count} receitas recalculadas com sucesso`,
      onSuccess: () => {
        invalidateAll()
        invalidateRecipeCaches()
        refetch()
      }
    })
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
            <Button variant="outline" onClick={handleRecalculateAll} disabled={isRecalculating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
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

        <SearchBar value={search} onChange={handleSearchChange} placeholder="Buscar por nome..." />

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
                            disabled={isDuplicating}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => confirmDelete.prompt(recipe)}
                            disabled={confirmDelete.isLoading}
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
      <Dialog open={duplicateDialog.isOpen} onOpenChange={duplicateDialog.setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar receita</DialogTitle>
            <DialogDescription>
              Deseja duplicar a receita &quot;{duplicateTarget?.name}&quot;? Uma cópia será criada com todos os ingredientes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={duplicateDialog.close} disabled={isDuplicating}>
              Cancelar
            </Button>
            <Button onClick={confirmDuplicate} disabled={isDuplicating}>
              {isDuplicating ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        title="Excluir receita"
        description={
          confirmDelete.pendingItem && (
            <>
              Tem certeza que deseja excluir <strong>{confirmDelete.pendingItem.name}</strong>? Esta ação não pode ser desfeita.
            </>
          )
        }
      />
    </>
  )
}
