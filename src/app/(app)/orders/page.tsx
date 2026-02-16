'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ordersApi, OrderCalculation } from '@/lib/api'
import { generateOrderPdf } from '@/lib/generate-order-pdf'
import { Plus, Trash2, Download, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useRecipesForOrders } from '@/hooks/use-recipes-for-orders'
import { FeatureGate } from '@/components/feature-gate'

interface OrderItem {
  id: string
  recipeId: string
  recipeName: string
  unitCost: number
  sellingPrice: number
  quantity: number
}

export default function OrdersPage() {
  const { recipes, isValidating } = useRecipesForOrders()
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')

  // Recipes with sellingPrice defined
  const availableRecipes = useMemo(
    () => recipes.filter((r) => r.sellingPrice && r.sellingPrice > 0),
    [recipes]
  )

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return availableRecipes
    return availableRecipes.filter((r) =>
      r.name.toLowerCase().includes(recipeSearch.toLowerCase())
    )
  }, [availableRecipes, recipeSearch])

  // Calculations from backend API
  const [calculations, setCalculations] = useState<OrderCalculation | null>(null)

  // Call backend API with debounce (500ms)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (items.length === 0) {
        setCalculations(null)
        return
      }

      try {
        const response = await ordersApi.calculate({
          items: items.map(item => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            sellingPrice: item.sellingPrice
          })),
          discountType,
          discountValue
        })
        setCalculations(response.data)
      } catch (error) {
        console.error('Error calculating order:', error)
        toast.error('Erro ao calcular pedido')
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [items, discountType, discountValue])

  // Extract calculated values (with fallbacks for loading state)
  const subtotalCost = calculations?.subtotalCost ?? 0
  const subtotalPrice = calculations?.subtotalPrice ?? 0
  const discountAmount = calculations?.discountAmount ?? 0
  const finalPrice = calculations?.totalPrice ?? 0
  const finalProfit = calculations?.totalProfit ?? 0
  const finalMargin = calculations?.margin ?? 0

  const handleAddItem = () => {
    if (!selectedRecipeId) {
      toast.error('Selecione uma receita')
      return
    }
    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    const recipe = recipes.find((r) => r.id === selectedRecipeId)
    if (!recipe) return

    const newItem: OrderItem = {
      id: `${recipe.id}-${Date.now()}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      unitCost: recipe.unitCost || 0,
      sellingPrice: recipe.sellingPrice || 0,
      quantity,
    }

    setItems([...items, newItem])
    setSelectedRecipeId('')
    setQuantity(1)
    setRecipeSearch('')
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) return
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)))
  }

  const handleClearOrder = () => {
    setItems([])
    setDiscountValue(0)
    setCustomerName('')
  }

  const handleExportPdf = () => {
    if (items.length === 0) {
      toast.error('Adicione itens ao pedido antes de exportar')
      return
    }

    generateOrderPdf({
      items: items.map((item) => ({
        recipeName: item.recipeName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        totalCost: item.unitCost * item.quantity,
        totalPrice: item.sellingPrice * item.quantity,
      })),
      customerName: customerName || undefined,
      subtotalCost,
      subtotalPrice,
      discountType,
      discountValue,
      finalPrice,
      finalProfit,
      finalMargin,
    })

    toast.success('PDF do pedido gerado com sucesso')
  }

  return (
    <FeatureGate feature="calculator">
      <PageHeader title="Calculadora de Pedidos" description="Monte pedidos e calcule custos, preços e lucro">
          <Button variant="outline" onClick={handleClearOrder} disabled={items.length === 0}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleExportPdf} disabled={items.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </PageHeader>

        {/* Add Item */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Adicionar Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-sm">Receita</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar receita..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Buscar receita..."
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredRecipes.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {availableRecipes.length === 0
                          ? 'Nenhuma receita com preço definido'
                          : 'Nenhuma receita encontrada'}
                      </div>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} - R$ {recipe.sellingPrice?.toFixed(2)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <Label className="text-sm">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Itens do Pedido ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    Adicione receitas ao pedido
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-24">Qtd</TableHead>
                        <TableHead>Custo Un.</TableHead>
                        <TableHead>Preco Un.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.recipeName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-20 h-8"
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            R$ {item.unitCost.toFixed(2)}
                          </TableCell>
                          <TableCell>R$ {item.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            R$ {(item.sellingPrice * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Customer Name */}
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm">Nome do Cliente (opcional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Para incluir no PDF"
                  className="mt-1"
                />
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Desconto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">R$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {discountAmount > subtotalPrice && (
                  <p className="text-xs text-red-600 mt-2">
                    Desconto excede o subtotal
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Custo:</span>
                  <span>R$ {subtotalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Preco:</span>
                  <span>R$ {subtotalPrice.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Desconto:</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Total Final:</span>
                  <span>R$ {finalPrice.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-sm ${finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Lucro:</span>
                  <span>R$ {finalProfit.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-sm ${finalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Margem:</span>
                  <span>{finalMargin.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </FeatureGate>
  )
}
