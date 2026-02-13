'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ingredientsApi, Ingredient } from '@/lib/api'
import { PriceHistoryChart } from '@/components/price-history-chart'
import { CSVImportDialog } from '@/components/csv-import-dialog'
import { TablePagination } from '@/components/table-pagination'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useIngredients } from '@/hooks/use-ingredients'
import { useRecipesStore } from '@/stores/use-recipes-store'
import { useRecipeDetailStore } from '@/stores/use-recipe-detail-store'
import { useDashboardStore } from '@/stores/use-dashboard-store'

export default function IngredientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { ingredients, pagination, isValidating, deleteIngredient, refetch, invalidateAll } = useIngredients(search, page)
  const invalidateRecipes = useRecipesStore(state => state.invalidate)
  const invalidateRecipeDetails = useRecipeDetailStore(state => state.invalidate)
  const invalidateDashboard = useDashboardStore(state => state.clear)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<{ id: string; name: string; usedInRecipes: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    cost: 0,
    unit: 'g',
    supplier: ''
  })

  useEffect(() => {
    setPage(1)
  }, [search])


  const handleOpenDialog = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingId(ingredient.id)
      setFormData({
        name: ingredient.name,
        quantity: ingredient.quantity,
        cost: ingredient.cost,
        unit: ingredient.unit,
        supplier: ingredient.supplier || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        quantity: 0,
        cost: 0,
        unit: 'g',
        supplier: ''
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const response = await ingredientsApi.update(editingId, formData)
        const recipesUpdated = (response.data as any).recipesUpdated || 0
        if (recipesUpdated > 0) {
          toast.success(`Ingrediente atualizado. ${recipesUpdated} receita(s) recalculada(s)`)
          // Invalidar TODOS os caches que dependem de receitas
          invalidateRecipes() // Lista de receitas
          invalidateRecipeDetails() // Detalhes de receitas
          invalidateDashboard() // Dashboard (métricas de receitas)
        } else {
          toast.success('Ingrediente atualizado com sucesso')
        }
      } else {
        await ingredientsApi.create(formData)
        toast.success('Ingrediente criado com sucesso')
      }
      handleCloseDialog()
      invalidateAll()
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar ingrediente')
    }
  }

  const handleDeleteClick = (ingredient: Ingredient) => {
    setIngredientToDelete({ id: ingredient.id, name: ingredient.name, usedInRecipes: ingredient.usedInRecipes || 0 })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ingredientToDelete) return

    try {
      await deleteIngredient(ingredientToDelete.id, ingredientToDelete.name)
    } finally {
      setDeleteDialogOpen(false)
      setIngredientToDelete(null)
    }
  }

  const filteredIngredients = supplierFilter === 'all'
    ? ingredients
    : ingredients.filter(i => i.supplier === supplierFilter)

  return (
    <>
      <PageHeader title="Ingredientes" description="Gerencie os ingredientes e seus custos">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ingrediente
          </Button>
        </PageHeader>

        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome...">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos fornecedores</SelectItem>
              {Array.from(new Set(ingredients.map(i => i.supplier).filter(Boolean))).sort().map(supplier => (
                <SelectItem key={supplier} value={supplier!}>{supplier}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SearchBar>

        <DataTable
          loading={isValidating}
          empty={filteredIngredients.length === 0}
          emptyMessage="Nenhum ingrediente encontrado"
          emptyAction={
            <Button variant="link" onClick={() => handleOpenDialog()} className="mt-2">
              Criar primeiro ingrediente
            </Button>
          }
        >
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Custo/Unidade</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Usado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>
                        {ingredient.quantity} {ingredient.unit}
                      </TableCell>
                      <TableCell>R$ {ingredient.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        R$ {ingredient.costPerUnit.toFixed(4)}/{ingredient.unit}
                      </TableCell>
                      <TableCell>{ingredient.supplier || '-'}</TableCell>
                      <TableCell>
                        {ingredient.usedInRecipes ? (
                          <span className="text-sm text-muted-foreground">{ingredient.usedInRecipes} receita(s)</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(ingredient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(ingredient)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do ingrediente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseFloat(e.target.value) || 0
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unidade *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramas (g)</SelectItem>
                      <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="l">Litros (l)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cost">Custo Total (R$) *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: parseFloat(e.target.value) || 0
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                />
              </div>

              {formData.quantity > 0 && formData.cost > 0 && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">
                    <strong>Custo por unidade:</strong> R${' '}
                    {(formData.cost / formData.quantity).toFixed(4)}/{formData.unit}
                  </p>
                </div>
              )}

              {editingId && (
                <PriceHistoryChart
                  entityType="ingredient"
                  entityId={editingId}
                  title="Histórico de Preços"
                  fields={['cost', 'quantity']}
                />
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ingredientToDelete && ingredientToDelete.usedInRecipes > 0
                ? 'Não é possível excluir'
                : 'Confirmar Exclusão'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {ingredientToDelete && ingredientToDelete.usedInRecipes > 0 ? (
                  <>
                    <p>
                      O ingrediente <strong>{ingredientToDelete.name}</strong> está sendo usado em{' '}
                      <strong>{ingredientToDelete.usedInRecipes} receita(s)</strong>.
                    </p>
                    <p className="mt-2">
                      Remova este ingrediente das receitas antes de excluí-lo.
                    </p>
                  </>
                ) : (
                  <p>
                    Tem certeza que deseja excluir <strong>{ingredientToDelete?.name}</strong>?
                    Esta ação não pode ser desfeita.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {ingredientToDelete && ingredientToDelete.usedInRecipes > 0 ? (
              <AlertDialogCancel>Entendi</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          invalidateAll()
          invalidateRecipes() // Invalidar lista de receitas
          invalidateRecipeDetails() // Invalidar detalhes de receitas
          invalidateDashboard() // Invalidar dashboard
          refetch()
        }}
      />
    </>
  )
}
