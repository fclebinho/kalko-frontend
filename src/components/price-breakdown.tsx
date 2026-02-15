'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceBreakdownProps {
  sellingPrice: number
  cost: number
  taxAmount?: number
  netProfit?: number
  taxRate?: number
  className?: string
  compact?: boolean
}

export function PriceBreakdown({
  sellingPrice,
  cost,
  taxAmount = 0,
  netProfit,
  taxRate = 0,
  className,
  compact = false
}: PriceBreakdownProps) {
  // Se netProfit não foi fornecido, calcular
  const calculatedNetProfit = netProfit ?? (sellingPrice - cost - taxAmount)

  // Calcular percentuais
  const costPercent = sellingPrice > 0 ? (cost / sellingPrice) * 100 : 0
  const taxPercent = sellingPrice > 0 ? (taxAmount / sellingPrice) * 100 : 0
  const profitPercent = sellingPrice > 0 ? (calculatedNetProfit / sellingPrice) * 100 : 0

  // Verificar se tem prejuízo
  const hasLoss = calculatedNetProfit < 0

  if (compact) {
    return (
      <div className={cn("space-y-1 text-sm", className)}>
        <div className="flex justify-between font-semibold">
          <span>Preço Venda:</span>
          <span>R$ {sellingPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground pl-4">
          <span>├─ Custo:</span>
          <span>R$ {cost.toFixed(2)} ({costPercent.toFixed(0)}%)</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-muted-foreground pl-4">
            <span>├─ Impostos:</span>
            <span>R$ {taxAmount.toFixed(2)} ({taxPercent.toFixed(0)}%)</span>
          </div>
        )}
        <div className={cn(
          "flex justify-between pl-4",
          hasLoss ? "text-red-600 font-semibold" : "text-green-600 font-semibold"
        )}>
          <span>└─ Lucro Líq:</span>
          <span>R$ {calculatedNetProfit.toFixed(2)} ({profitPercent.toFixed(0)}%)</span>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <CardTitle>Breakdown de Preço</CardTitle>
        </div>
        <CardDescription>
          Composição detalhada do preço de venda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Preço de Venda */}
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
            <span className="font-semibold">Preço de Venda</span>
            <span className="text-xl font-bold text-primary">
              R$ {sellingPrice.toFixed(2)}
            </span>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {/* Custo */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custo</span>
              <div className="text-right">
                <div className="font-semibold">R$ {cost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{costPercent.toFixed(1)}%</div>
              </div>
            </div>

            {/* Impostos */}
            {taxAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Impostos ({taxRate}%)
                </span>
                <div className="text-right">
                  <div className="font-semibold">R$ {taxAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{taxPercent.toFixed(1)}%</div>
                </div>
              </div>
            )}

            {/* Lucro Líquido */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-semibold">Lucro Líquido</span>
              <div className="text-right">
                <div className={cn(
                  "font-bold text-lg",
                  hasLoss ? "text-red-600" : "text-green-600"
                )}>
                  R$ {calculatedNetProfit.toFixed(2)}
                </div>
                <div className={cn(
                  "text-xs font-semibold",
                  hasLoss ? "text-red-600" : "text-green-600"
                )}>
                  {profitPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Alert de prejuízo */}
          {hasLoss && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-semibold">
                ⚠️ PREJUÍZO! O preço está abaixo do custo + impostos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
