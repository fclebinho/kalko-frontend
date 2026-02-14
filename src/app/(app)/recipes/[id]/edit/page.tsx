'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { recipesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { IngredientSelector } from '@/components/ingredient-selector'
import { useInvalidateRecipeCaches } from '@/hooks/use-invalidate-recipe-caches'

interface RecipeIngredient {
  ingredientId?: string
  subRecipeId?: string
  ingredientName: string
  quantity: number
  unit: string
  isSubRecipe: boolean
}

interface RecipeData {
  id: string
  name: string
  description?: string
  category?: string
  prepTime: number
  cookingTime?: number
  instructions?: string
  equipment?: string[]
  difficulty?: string
  notes?: string
  storage?: string
  tips?: string
  shelfLife?: number
  yield: number
  yieldUnit?: string
  sellingPrice?: number
  ingredients: Array<{
    id: string
    ingredientId?: string
    subRecipeId?: string
    quantity: number
    ingredient?: {
      id: string
      name: string
      unit: string
    }
    subRecipe?: {
      id: string
      name: string
      unitCost?: number
      yield: number
      yieldUnit?: string
    }
  }>
}

export default function EditRecipePage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname?.split('/').filter(Boolean)[1] || ''
  const invalidateRecipeCaches = useInvalidateRecipeCaches()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [prepTime, setPrepTime] = useState(0)
  const [cookingTime, setCookingTime] = useState(0)
  const [instructions, setInstructions] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [equipmentInput, setEquipmentInput] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [notes, setNotes] = useState('')
  const [storage, setStorage] = useState('')
  const [tips, setTips] = useState('')
  const [shelfLife, setShelfLife] = useState(0)
  const [yieldAmount, setYieldAmount] = useState(1)
  const [yieldUnit, setYieldUnit] = useState('un')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [sellingPrice, setSellingPrice] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadRecipe()
    }
  }, [id])

  const loadRecipe = async () => {
    try {
      setLoading(true)
      const response = await recipesApi.get(id)
      const recipe = response.data as RecipeData

      setName(recipe.name)
      setDescription(recipe.description || '')
      setCategory(recipe.category || '')
      setPrepTime(recipe.prepTime)
      setCookingTime(recipe.cookingTime || 0)
      setInstructions(recipe.instructions || '')
      setEquipment(recipe.equipment || [])
      setDifficulty(recipe.difficulty || '')
      setNotes(recipe.notes || '')
      setStorage(recipe.storage || '')
      setTips(recipe.tips || '')
      setShelfLife(recipe.shelfLife || 0)
      setYieldAmount(recipe.yield)
      setYieldUnit(recipe.yieldUnit || 'un')
      setSellingPrice(recipe.sellingPrice || null)

      // Convert ingredients to the format expected by the form
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredients(
          recipe.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId || undefined,
            subRecipeId: ing.subRecipeId || undefined,
            ingredientName: ing.ingredient?.name || ing.subRecipe?.name || '',
            quantity: ing.quantity,
            unit: ing.ingredient?.unit || ing.subRecipe?.yieldUnit || 'un',
            isSubRecipe: !!ing.subRecipeId,
          }))
        )
      }
    } catch (error) {
      toast.error('Erro ao carregar receita')
      router.push('/recipes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !prepTime || !yieldAmount) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (ingredients.length === 0) {
      toast.error('Adicione pelo menos um ingrediente')
      return
    }

    try {
      setSaving(true)

      const data = {
        name,
        description: description || undefined,
        category: category || undefined,
        prepTime,
        cookingTime: cookingTime > 0 ? cookingTime : undefined,
        instructions: instructions || undefined,
        yield: yieldAmount,
        yieldUnit,
        ingredients: ingredients.map((ing) => ({
          ...(ing.ingredientId ? { ingredientId: ing.ingredientId } : {}),
          ...(ing.subRecipeId ? { subRecipeId: ing.subRecipeId } : {}),
          quantity: ing.quantity,
        })),
      }

      await recipesApi.update(id, data)

      // Se mudou o preço, atualizar
      if (sellingPrice !== null && sellingPrice > 0) {
        await recipesApi.updatePrice(id, sellingPrice)
      }

      // Invalidar caches para forçar refetch dos dados atualizados
      invalidateRecipeCaches({ recipeId: id }) // Invalida este detalhe, lista e dashboard

      toast.success('Receita atualizada com sucesso!')
      router.push(`/recipes/${id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar receita')
    } finally {
      setSaving(false)
    }
  }

  const addIngredient = (ingredient: RecipeIngredient) => {
    setIngredients([...ingredients, ingredient])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const newIngredients = [...ingredients]
    newIngredients[index].quantity = quantity
    setIngredients(newIngredients)
  }

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setEquipment([...equipment, equipmentInput.trim()])
      setEquipmentInput('')
    }
  }

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push(`/recipes/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Detalhes
        </Button>

        <h1 className="text-3xl font-bold mb-8">Editar Receita</h1>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais da receita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Receita *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bolo de Chocolate"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional da receita"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    <SelectItem value="bolo">Bolo</SelectItem>
                    <SelectItem value="torta">Torta</SelectItem>
                    <SelectItem value="doce">Doce</SelectItem>
                    <SelectItem value="sobremesa">Sobremesa</SelectItem>
                    <SelectItem value="salgado">Salgado</SelectItem>
                    <SelectItem value="pao">Pão</SelectItem>
                    <SelectItem value="biscoito">Biscoito</SelectItem>
                    <SelectItem value="mousse">Mousse</SelectItem>
                    <SelectItem value="recheio">Recheio</SelectItem>
                    <SelectItem value="cobertura">Cobertura</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prepTime">Tempo de Preparo (min) *</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={prepTime || ''}
                    onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                    placeholder="60"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cookingTime">Tempo de Cozimento (min)</Label>
                  <Input
                    id="cookingTime"
                    type="number"
                    value={cookingTime || ''}
                    onChange={(e) => setCookingTime(parseInt(e.target.value) || 0)}
                    placeholder="40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yield">Rendimento *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="yield"
                      type="number"
                      step={yieldUnit === 'un' ? '1' : '0.01'}
                      value={yieldAmount || ''}
                      onChange={(e) => setYieldAmount(parseFloat(e.target.value) || 1)}
                      placeholder="10"
                      className="flex-1"
                      required
                    />
                    <Select value={yieldUnit} onValueChange={setYieldUnit}>
                      <SelectTrigger className="w-[130px]">
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
              </div>

              <div>
                <Label htmlFor="instructions">Modo de Preparo</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Descreva o passo a passo do preparo da receita..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite as instruções detalhadas de preparo. Cada linha representa um passo.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ingredientes</CardTitle>
              <CardDescription>Adicione os ingredientes e suas quantidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <IngredientSelector onAdd={addIngredient} excludeRecipeId={id} />

              {ingredients.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">
                    Ingredientes Adicionados ({ingredients.length})
                  </h3>
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {ing.ingredientName}
                            {ing.isSubRecipe && (
                              <Badge variant="secondary" className="text-xs">Sub-receita</Badge>
                            )}
                          </div>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={ing.quantity}
                          onChange={(e) =>
                            updateIngredientQuantity(index, parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground w-12">{ing.unit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações Profissionais</CardTitle>
              <CardDescription>Informações opcionais para ficha técnica profissional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="equipment">Equipamentos Necessários</Label>
                <div className="flex gap-2">
                  <Input
                    id="equipment"
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    placeholder="Ex: Batedeira, Forno"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                  />
                  <Button type="button" onClick={addEquipment} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {equipment.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {equipment.map((eq, i) => (
                      <Badge key={i} variant="secondary">
                        {eq}
                        <button
                          type="button"
                          onClick={() => removeEquipment(i)}
                          className="ml-2 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                <Select value={difficulty || undefined} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Selecione a dificuldade (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storage">Armazenamento</Label>
                  <Textarea
                    id="storage"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="Ex: Manter refrigerado a 4°C"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="shelfLife">Validade (dias)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    value={shelfLife || ''}
                    onChange={(e) => setShelfLife(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 7"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tips">Dicas Profissionais</Label>
                <Textarea
                  id="tips"
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  placeholder="Dicas e truques para melhor resultado..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionais</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações importantes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Preço de Venda</CardTitle>
              <CardDescription>Defina o preço de venda (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="sellingPrice">Preço de Venda (R$)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || null)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/recipes/${id}`)}
            >
              Cancelar
            </Button>
          </div>
        </form>
    </div>
  )
}
