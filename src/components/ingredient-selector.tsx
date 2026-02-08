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
import { ingredientsApi, Ingredient } from '@/lib/api'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IngredientSelectorProps {
  onAdd: (ingredient: {
    ingredientId: string
    ingredientName: string
    quantity: number
    unit: string
  }) => void
}

export function IngredientSelector({ onAdd }: IngredientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [quantity, setQuantity] = useState<number>(0)

  useEffect(() => {
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    try {
      const response = await ingredientsApi.list()
      setIngredients(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error)
    }
  }

  const handleAdd = () => {
    if (!selectedIngredient || !quantity || quantity <= 0) {
      return
    }

    onAdd({
      ingredientId: selectedIngredient.id,
      ingredientName: selectedIngredient.name,
      quantity,
      unit: selectedIngredient.unit
    })

    // Reset
    setSelectedIngredient(null)
    setQuantity(0)
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
      <div>
        <Label>Selecione um Ingrediente</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedIngredient
                ? selectedIngredient.name
                : "Buscar ingrediente..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar ingrediente..." />
              <CommandList>
                <CommandEmpty>Nenhum ingrediente encontrado.</CommandEmpty>
                <CommandGroup>
                  {ingredients.map((ingredient) => (
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
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedIngredient && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity || ''}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Unidade</Label>
            <Input
              value={selectedIngredient.unit}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      )}

      {selectedIngredient && quantity > 0 && (
        <div className="bg-background p-3 rounded-md border">
          <div className="text-sm text-muted-foreground mb-1">Custo estimado:</div>
          <div className="text-lg font-semibold">
            R$ {(selectedIngredient.costPerUnit * quantity).toFixed(2)}
          </div>
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={!selectedIngredient || !quantity || quantity <= 0}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Ingrediente
      </Button>
    </div>
  )
}
