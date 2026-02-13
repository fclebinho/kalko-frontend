'use client'

import { useState } from 'react'
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
import { useIngredients } from '@/hooks/use-ingredients'
import { useInvalidateRecipeCaches } from '@/hooks/use-invalidate-recipe-caches'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

export default function IngredientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { ingredients, pagination, isValidating, refetch, invalidateAll } = useIngredients(search, page)
  const invalidateRecipeCaches = useInvalidateRecipeCaches()

  // 🎯 SOLID: Hooks reutilizáveis para dialogs
  const formDialog = useDialog()
  const importDialog = useDialog()

  // 🎯 SOLID: Hook para operações assíncronas
  const { execute: saveIngredient, isLoading: isSaving } = useAsyncOperation()

  // 🎯 SOLID: Hook para confirmação de delete
  const confirmDelete = useConfirmDelete<Ingredient>({
    onConfirm: async (ingredient) => {
      await ingredientsApi.delete(ingredient.id)
    },
    successMessage: (item) => `${item.name} excluído com sucesso`,
    getWarningMessage: (item) =>
      item.usedInRecipes && item.usedInRecipes > 0
        ? `O ingrediente "${item.name}" está sendo usado em ${item.usedInRecipes} receita(s). Remova-o das receitas antes de excluir.`
        : null,
    onSuccess: () => {
      invalidateAll()
      refetch()
    }
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    cost: 0,
    unit: 'g',
    supplier: ''
  })

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }


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
    formDialog.open()
  }

  const handleCloseDialog = () => {
    formDialog.close()
    setEditingId(null)
  }

  // 🎯 DRY: Operação assíncrona com toast automático
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Update
      await saveIngredient({
        operation: async () => {
          const response = await ingredientsApi.update(editingId, formData)
          return response
        },
        successMessage: 'Ingrediente atualizado com sucesso',
        onSuccess: (response: any) => {
          const recipesUpdated = response.data?.recipesUpdated || 0
          if (recipesUpdated > 0) {
            invalidateRecipeCaches()
          }
          handleCloseDialog()
          invalidateAll()
          refetch()
        }
      })
    } else {
      // Create
      await saveIngredient({
        operation: () => ingredientsApi.create(formData),
        successMessage: 'Ingrediente criado com sucesso',
        onSuccess: () => {
          handleCloseDialog()
          invalidateAll()
          refetch()
        }
      })
    }
  }

  const filteredIngredients = supplierFilter === 'all'
    ? ingredients
    : ingredients.filter(i => i.supplier === supplierFilter)

  return (
    <>
      <PageHeader title="Ingredientes" description="Gerencie os ingredientes e seus custos">
          <Button variant="outline" onClick={importDialog.open}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ingrediente
          </Button>
        </PageHeader>

        <SearchBar value={search} onChange={handleSearchChange} placeholder="Buscar por nome...">
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
                            onClick={() => confirmDelete.prompt(ingredient)}
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
      <Dialog open={formDialog.isOpen} onOpenChange={formDialog.setIsOpen}>
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
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🎯 DRY: Componente reutilizável de confirmação */}
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        description={confirmDelete.pendingItem && !confirmDelete.warningMessage && (
          <>Tem certeza que deseja excluir <strong>{confirmDelete.pendingItem.name}</strong>? Esta ação não pode ser desfeita.</>
        )}
      />

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={importDialog.isOpen}
        onOpenChange={importDialog.setIsOpen}
        onImportComplete={() => {
          invalidateAll()
          invalidateRecipeCaches() // Invalida lista, detalhes e dashboard
          refetch()
        }}
      />
    </>
  )
}
