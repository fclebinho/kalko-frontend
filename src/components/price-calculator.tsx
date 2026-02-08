'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp, Target, DollarSign } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface PriceCalculatorProps {
  unitCost: number
  suggestedPrice: number
  currentPrice?: number
  onApplyPrice?: (price: number) => void
}

export function PriceCalculator({
  unitCost,
  suggestedPrice,
  currentPrice,
  onApplyPrice,
}: PriceCalculatorProps) {
  const [desiredMargin, setDesiredMargin] = useState(50)
  const [targetProfit, setTargetProfit] = useState(10)
  const [customPrice, setCustomPrice] = useState(currentPrice || suggestedPrice)

  // Calcular preço baseado em margem desejada
  const calculatePriceByMargin = (margin: number) => {
    // margem = (preço - custo) / preço * 100
    // preço = custo / (1 - margem/100)
    return unitCost / (1 - margin / 100)
  }

  // Calcular preço para lucro alvo
  const calculatePriceByProfit = (profit: number) => {
    return unitCost + profit
  }

  // Calcular margem de um preço
  const calculateMargin = (price: number) => {
    if (price <= 0) return 0
    return ((price - unitCost) / price) * 100
  }

  // Calcular lucro de um preço
  const calculateProfit = (price: number) => {
    return price - unitCost
  }

  const priceByMargin = calculatePriceByMargin(desiredMargin)
  const priceByProfit = calculatePriceByProfit(targetProfit)
  const customMargin = calculateMargin(customPrice)
  const customProfitValue = calculateProfit(customPrice)

  const getMarginColor = (margin: number) => {
    if (margin < 0) return 'text-red-600'
    if (margin < 20) return 'text-orange-600'
    if (margin < 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle>Calculadora de Preço</CardTitle>
        </div>
        <CardDescription>
          Simule diferentes cenários de precificação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Base */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Custo Unitário</div>
            <div className="text-lg font-bold">R$ {unitCost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Preço Sugerido (50%)</div>
            <div className="text-lg font-bold text-primary">
              R$ {suggestedPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Cenário 1: Por Margem */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <Label>Simular por Margem de Lucro</Label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Margem desejada:</span>
              <span className="font-bold">{desiredMargin}%</span>
            </div>
            <Slider
              value={[desiredMargin]}
              onValueChange={(value) => setDesiredMargin(value[0])}
              min={0}
              max={80}
              step={1}
              className="w-full"
            />
          </div>

          <div className="p-3 bg-primary/10 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm">Preço calculado:</span>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">
                  R$ {priceByMargin.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lucro: R$ {calculateProfit(priceByMargin).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cenário 2: Por Lucro Alvo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <Label htmlFor="targetProfit">Simular por Lucro Desejado</Label>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="targetProfit" className="text-xs">
                Lucro por unidade (R$)
              </Label>
              <Input
                id="targetProfit"
                type="number"
                step="0.01"
                value={targetProfit}
                onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm">Preço calculado:</span>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">
                  R$ {priceByProfit.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Margem: {calculateMargin(priceByProfit).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cenário 3: Preço Personalizado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <Label htmlFor="customPrice">Testar Preço Personalizado</Label>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            {onApplyPrice && (
              <Button onClick={() => onApplyPrice(customPrice)} size="sm">
                Aplicar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Margem</div>
              <div className={`text-lg font-bold ${getMarginColor(customMargin)}`}>
                {customMargin.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Lucro</div>
              <div
                className={`text-lg font-bold ${
                  customProfitValue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                R$ {customProfitValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Comparação */}
        {currentPrice && currentPrice > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-semibold mb-3">Comparação</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Atual:</span>
                <span className="font-medium">R$ {currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Sugerido:</span>
                <span className="font-medium">R$ {suggestedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diferença:</span>
                <span
                  className={`font-medium ${
                    currentPrice < suggestedPrice ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {currentPrice < suggestedPrice ? '-' : '+'}R${' '}
                  {Math.abs(currentPrice - suggestedPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
