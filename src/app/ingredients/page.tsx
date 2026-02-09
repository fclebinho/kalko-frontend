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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<{ id: string; name: string; usedInRecipes: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    cost: 0,
    unit: 'g',
    supplier: ''
  })

  useEffect(() => {
    loadIngredients()
  }, [search])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      const response = await ingredientsApi.list({ search })
      setIngredients(response.data.data)
    } catch (error) {
      toast.error('Erro ao carregar ingredientes')
    } finally {
      setLoading(false)
    }
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
        } else {
          toast.success('Ingrediente atualizado com sucesso')
        }
      } else {
        await ingredientsApi.create(formData)
        toast.success('Ingrediente criado com sucesso')
      }
      handleCloseDialog()
      loadIngredients()
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
      await ingredientsApi.delete(ingredientToDelete.id)
      toast.success('Ingrediente excluído com sucesso')
      loadIngredients()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir ingrediente')
    } finally {
      setDeleteDialogOpen(false)
      setIngredientToDelete(null)
    }
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Ingredientes</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ingrediente
          </Button>
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
            ) : ingredients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>Nenhum ingrediente encontrado</p>
                <Button
                  variant="link"
                  onClick={() => handleOpenDialog()}
                  className="mt-2"
                >
                  Criar primeiro ingrediente
                </Button>
              </div>
            ) : (
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
                  {ingredients.map((ingredient) => (
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
            )}
          </CardContent>
        </Card>
      </div>

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
    </>
  )
}
