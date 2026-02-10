'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ingredientsApi, recipesApi, Ingredient, Recipe } from '@/lib/api'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'ingredient' | 'subRecipe'

interface IngredientSelectorProps {
  onAdd: (item: {
    ingredientId?: string
    subRecipeId?: string
    ingredientName: string
    quantity: number
    unit: string
    isSubRecipe: boolean
  }) => void
  excludeRecipeId?: string
}

export function IngredientSelector({ onAdd, excludeRecipeId }: IngredientSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ingredient')
  const [open, setOpen] = useState(false)

  // Ingredient state
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  // Sub-recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const [quantity, setQuantity] = useState<number>(0)

  useEffect(() => {
    ingredientsApi.list({ limit: 200 })
      .then((response) => setIngredients(response.data.data))
      .catch((err) => console.error('Erro ao carregar ingredientes:', err))

    recipesApi.list({ limit: 200 })
      .then((response) => setRecipes(response.data.data))
      .catch((err) => console.error('Erro ao carregar receitas:', err))
  }, [])

  const availableRecipes = recipes.filter(r => r.id !== excludeRecipeId)

  const handleAdd = () => {
    if (activeTab === 'ingredient') {
      if (!selectedIngredient || !quantity || quantity <= 0) return

      onAdd({
        ingredientId: selectedIngredient.id,
        ingredientName: selectedIngredient.name,
        quantity,
        unit: selectedIngredient.unit,
        isSubRecipe: false
      })

      setSelectedIngredient(null)
    } else {
      if (!selectedRecipe || !quantity || quantity <= 0) return

      onAdd({
        subRecipeId: selectedRecipe.id,
        ingredientName: selectedRecipe.name,
        quantity,
        unit: selectedRecipe.yieldUnit || 'un',
        isSubRecipe: true
      })

      setSelectedRecipe(null)
    }

    setQuantity(0)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSelectedIngredient(null)
    setSelectedRecipe(null)
    setQuantity(0)
    setOpen(false)
  }

  const isValid = activeTab === 'ingredient'
    ? !!selectedIngredient && quantity > 0
    : !!selectedRecipe && quantity > 0

  const estimatedCost = activeTab === 'ingredient'
    ? selectedIngredient && quantity > 0
      ? selectedIngredient.costPerUnit * quantity
      : null
    : selectedRecipe?.unitCost && quantity > 0
      ? selectedRecipe.unitCost * quantity
      : null

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => handleTabChange('ingredient')}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === 'ingredient'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Ingredientes
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('subRecipe')}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === 'subRecipe'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sub-Receitas
        </button>
      </div>

      {/* Selector */}
      <div>
        <Label>
          {activeTab === 'ingredient' ? 'Selecione um Ingrediente' : 'Selecione uma Receita'}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {activeTab === 'ingredient'
                ? (selectedIngredient?.name || "Buscar ingrediente...")
                : (selectedRecipe?.name || "Buscar receita...")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput
                placeholder={activeTab === 'ingredient' ? "Buscar ingrediente..." : "Buscar receita..."}
              />
              <CommandList>
                <CommandEmpty>
                  {activeTab === 'ingredient' ? 'Nenhum ingrediente encontrado.' : 'Nenhuma receita encontrada.'}
                </CommandEmpty>
                <CommandGroup>
                  {activeTab === 'ingredient'
                    ? ingredients.map((ingredient) => (
                        <CommandItem
                          key={ingredient.id}
                          value={ingredient.name}
                          onSelect={() => {
                            setSelectedIngredient(ingredient)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIngredient?.id === ingredient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div>{ingredient.name}</div>
                            <div className="text-xs text-muted-foreground">
                              R$ {ingredient.costPerUnit.toFixed(4)}/{ingredient.unit}
                            </div>
                          </div>
                        </CommandItem>
                      ))
                    : availableRecipes.map((recipe) => (
                        <CommandItem
                          key={recipe.id}
                          value={recipe.name}
                          onSelect={() => {
                            setSelectedRecipe(recipe)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRecipe?.id === recipe.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div>{recipe.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {recipe.unitCost
                                ? `R$ ${recipe.unitCost.toFixed(2)}/${recipe.yieldUnit || 'un'} · Rende ${recipe.yield}${recipe.yieldUnit || 'un'}`
                                : `Rende ${recipe.yield}${recipe.yieldUnit || 'un'}`}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quantity + Unit */}
      {(selectedIngredient || selectedRecipe) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              step={activeTab === 'subRecipe' ? (selectedRecipe?.yieldUnit === 'un' ? '1' : '0.01') : '0.01'}
              value={quantity || ''}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Unidade</Label>
            <Input
              value={activeTab === 'ingredient' ? (selectedIngredient?.unit || '') : (selectedRecipe?.yieldUnit || 'un')}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      )}

      {/* Estimated cost */}
      {estimatedCost !== null && (
        <div className="bg-background p-3 rounded-md border">
          <div className="text-sm text-muted-foreground mb-1">Custo estimado:</div>
          <div className="text-lg font-semibold">
            R$ {estimatedCost.toFixed(2)}
          </div>
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={!isValid}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {activeTab === 'ingredient' ? 'Adicionar Ingrediente' : 'Adicionar Sub-Receita'}
      </Button>
    </div>
  )
}
