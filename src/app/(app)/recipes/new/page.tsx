'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { recipesApi } from '@/lib/api'
import { ArrowLeft, ArrowRight, Check, ChefHat, Package, DollarSign, Info } from 'lucide-react'
import { toast } from 'sonner'
import { IngredientSelector } from '@/components/ingredient-selector'
import { InstructionsInput } from '@/components/instructions-input'

interface RecipeIngredient {
  ingredientId?: string
  subRecipeId?: string
  ingredientName: string
  quantity: number
  unit: string
  isSubRecipe: boolean
}

const STEPS = [
  { id: 1, name: 'Informações Básicas', icon: ChefHat },
  { id: 2, name: 'Ingredientes', icon: Package },
  { id: 3, name: 'Info. Profissionais', icon: Info },
  { id: 4, name: 'Preço de Venda', icon: DollarSign },
]

export default function NewRecipePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [prepTime, setPrepTime] = useState(0)
  const [cookingTime, setCookingTime] = useState(0)
  const [instructions, setInstructions] = useState('')
  const [yieldAmount, setYieldAmount] = useState(1)
  const [yieldUnit, setYieldUnit] = useState('un')

  // Step 2
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])

  // Step 3 - Professional fields (optional)
  const [equipment, setEquipment] = useState<string[]>([])
  const [equipmentInput, setEquipmentInput] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [notes, setNotes] = useState('')
  const [storage, setStorage] = useState('')
  const [tips, setTips] = useState('')
  const [shelfLife, setShelfLife] = useState(0)
  const [includeLaborAsSubRecipe, setIncludeLaborAsSubRecipe] = useState(false)

  // Step 4
  const [sellingPrice, setSellingPrice] = useState<number | null>(null)

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name || !prepTime || !yieldAmount) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }
    }

    if (currentStep === 2) {
      if (ingredients.length === 0) {
        toast.error('Adicione pelo menos um ingrediente')
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const data = {
        name,
        description: description || undefined,
        category: category || undefined,
        prepTime,
        cookingTime: cookingTime > 0 ? cookingTime : undefined,
        instructions: instructions || undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
        difficulty: difficulty || undefined,
        notes: notes || undefined,
        storage: storage || undefined,
        tips: tips || undefined,
        shelfLife: shelfLife > 0 ? shelfLife : undefined,
        yield: yieldAmount,
        yieldUnit,
        includeLaborAsSubRecipe,
        ingredients: ingredients.map(ing => ({
          ...(ing.ingredientId ? { ingredientId: ing.ingredientId } : {}),
          ...(ing.subRecipeId ? { subRecipeId: ing.subRecipeId } : {}),
          quantity: ing.quantity
        }))
      }

      const response = await recipesApi.create(data)
      const recipeId = response.data.id

      // Se definiu preço, atualizar
      if (sellingPrice && sellingPrice > 0) {
        await recipesApi.updatePrice(recipeId, sellingPrice)
      }

      toast.success('Receita criada com sucesso!')
      router.push(`/recipes/${recipeId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar receita')
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/recipes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Receitas
        </Button>

        <h1 className="text-3xl font-bold mb-8">Nova Receita</h1>

        {/* Steps Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isActive
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div className="text-center mt-2">
                      <div className={`text-sm font-medium ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.name}
                      </div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {STEPS.find(s => s.id === currentStep)?.name}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Informações básicas sobre a receita'}
              {currentStep === 2 && 'Adicione os ingredientes e suas quantidades'}
              {currentStep === 3 && 'Informações opcionais para ficha técnica profissional'}
              {currentStep === 4 && 'Defina o preço de venda (opcional)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
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

                <div>
                  <Label htmlFor="instructions">Modo de Preparo</Label>
                  <InstructionsInput
                    value={instructions}
                    onChange={setInstructions}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Ingredients */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <IngredientSelector onAdd={addIngredient} />

                {ingredients.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Ingredientes Adicionados ({ingredients.length})</h3>
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
                            onChange={(e) => updateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground w-12">{ing.unit}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Professional Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md mb-4">
                  <div className="text-sm text-muted-foreground">
                    Informações opcionais que tornam sua ficha técnica mais completa e profissional.
                  </div>
                </div>

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

                <div className="border rounded-lg p-4 bg-muted/30">
                  <label htmlFor="includeLaborAsSubRecipe" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="includeLaborAsSubRecipe"
                      type="checkbox"
                      checked={includeLaborAsSubRecipe}
                      onChange={(e) => setIncludeLaborAsSubRecipe(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">Incluir mão de obra quando usada como sub-receita</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se desmarcado, apenas o custo dos ingredientes será considerado quando esta receita for usada em outras receitas.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md mb-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Após criar a receita, os custos serão calculados automaticamente e você verá:
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Custo total e custo unitário</li>
                    <li>Preço sugerido (margem de 50%)</li>
                    <li>Análise de margens</li>
                    <li>Breakdown detalhado de custos</li>
                  </ul>
                </div>

                <div>
                  <Label htmlFor="sellingPrice">Preço de Venda (R$)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || null)}
                    placeholder="Deixe vazio para definir depois"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Você pode deixar vazio e definir depois de ver os custos calculados
                  </p>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="font-semibold mb-3">Resumo da Receita</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nome:</span>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de Preparo:</span>
                      <span className="font-medium">{prepTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimento:</span>
                      <span className="font-medium">{yieldAmount} {yieldUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ingredientes:</span>
                      <span className="font-medium">{ingredients.length}</span>
                    </div>
                    {sellingPrice && (
                      <div className="flex justify-between">
                        <span>Preço de Venda:</span>
                        <span className="font-medium">R$ {sellingPrice.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Receita'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
