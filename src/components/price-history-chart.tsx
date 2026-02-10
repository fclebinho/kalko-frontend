'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { historyApi, PriceHistoryEntry, HistoryComparison, HistoryTrend } from '@/lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'

const FIELD_LABELS: Record<string, string> = {
  cost: 'Custo',
  quantity: 'Quantidade',
  unitCost: 'Custo Unitário',
  totalCost: 'Custo Total',
  sellingPrice: 'Preço de Venda',
}

const FIELD_COLORS: Record<string, string> = {
  cost: '#ef4444',
  quantity: '#3b82f6',
  unitCost: '#f59e0b',
  totalCost: '#ef4444',
  sellingPrice: '#22c55e',
}

interface PriceHistoryChartProps {
  entityType: 'ingredient' | 'recipe'
  entityId: string
  title?: string
  fields: string[]
}

export function PriceHistoryChart({
  entityType,
  entityId,
  title,
  fields,
}: PriceHistoryChartProps) {
  const [entries, setEntries] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState<HistoryComparison | null>(null)
  const [trend, setTrend] = useState<HistoryTrend | null>(null)

  useEffect(() => {
    if (!entityId) return
    let cancelled = false

    // Fetch history, comparison, and trend in parallel
    const mainField = fields[0] || 'cost'

    Promise.all([
      historyApi.getHistory(entityType, entityId),
      historyApi.getComparison(entityType, entityId, mainField).catch(() => null),
      historyApi.getTrend(entityType, entityId, mainField).catch(() => null),
    ]).then(([historyRes, compRes, trendRes]) => {
      if (cancelled) return
      setEntries(historyRes.data.data)
      if (compRes?.data?.current !== null) setComparison(compRes?.data ?? null)
      if (trendRes?.data) setTrend(trendRes.data)
    }).catch(() => {
      if (!cancelled) setEntries([])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [entityType, entityId, fields])

  if (loading) return null

  // Filtrar apenas os campos solicitados
  const relevantEntries = entries.filter((e) => fields.includes(e.field))
  if (relevantEntries.length < 2) return null

  // Construir data points por timestamp
  const dataPointsByField = new Map<string, Array<{ date: string; value: number }>>()

  for (const field of fields) {
    const fieldEntries = relevantEntries.filter((e) => e.field === field)
    if (fieldEntries.length === 0) continue

    const points: Array<{ date: string; value: number }> = []
    const first = fieldEntries[0]
    points.push({
      date: new Date(new Date(first.createdAt).getTime() - 1000).toISOString(),
      value: first.oldValue,
    })
    for (const entry of fieldEntries) {
      points.push({ date: entry.createdAt, value: entry.newValue })
    }
    dataPointsByField.set(field, points)
  }

  // Merge all timestamps and build unified data
  const allTimestamps = new Set<string>()
  dataPointsByField.forEach((points) => {
    points.forEach((p) => allTimestamps.add(p.date))
  })

  const sortedTimestamps = Array.from(allTimestamps).sort()

  // Add trend projection points if available
  const hasTrendProjections = trend && trend.projections && trend.projections.length > 0
  if (hasTrendProjections) {
    for (const proj of trend!.projections) {
      allTimestamps.add(proj.date)
    }
  }

  const allTimestampsSorted = Array.from(allTimestamps).sort()

  const chartData = allTimestampsSorted.map((ts) => {
    const point: Record<string, any> = {
      date: new Date(ts).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    for (const [field, points] of dataPointsByField) {
      let value: number | undefined
      for (const p of points) {
        if (p.date <= ts) value = p.value
      }
      if (value !== undefined) point[field] = value
    }

    // Add trend projection value
    if (hasTrendProjections) {
      const projection = trend!.projections.find(p => p.date === ts)
      if (projection) {
        point.projection = projection.value
      }
      // Also set projection for the last real data point to connect the line
      if (!projection && sortedTimestamps.length > 0 && ts === sortedTimestamps[sortedTimestamps.length - 1]) {
        const mainField = fields[0]
        if (point[mainField] !== undefined) {
          point.projection = point[mainField]
        }
      }
    }

    return point
  })

  if (chartData.length < 2) return null

  const activeFields = Array.from(dataPointsByField.keys())

  const TrendIcon = trend?.trend === 'up' ? TrendingUp : trend?.trend === 'down' ? TrendingDown : Minus
  const trendColor = trend?.trend === 'up' ? 'text-red-600' : trend?.trend === 'down' ? 'text-green-600' : 'text-muted-foreground'
  const trendLabel = trend?.trend === 'up' ? 'Tendência de alta' : trend?.trend === 'down' ? 'Tendência de baixa' : 'Estável'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title || 'Histórico de Preços'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => [
                  `R$ ${Number(value ?? 0).toFixed(2)}`,
                  name === 'projection' ? 'Projeção' : (FIELD_LABELS[name] || name),
                ]) as any}
              />
              {(activeFields.length > 1 || hasTrendProjections) && (
                <Legend formatter={(v) => v === 'projection' ? 'Projeção' : (FIELD_LABELS[v] || v)} />
              )}
              {activeFields.map((field) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={FIELD_COLORS[field] || '#8884d8'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
              {hasTrendProjections && (
                <Line
                  type="monotone"
                  dataKey="projection"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison + Trend info */}
        {(comparison?.current !== null || trend) && (
          <div className="flex flex-wrap gap-4">
            {comparison && comparison.current !== null && comparison.threeMonthsAgo !== null && (
              <div className="flex-1 min-w-[200px] rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Comparação (3 meses)</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    R$ {comparison.threeMonthsAgo.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm font-medium">
                    R$ {comparison.current.toFixed(2)}
                  </span>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    comparison.percentageChange > 0 ? 'text-red-600' : comparison.percentageChange < 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {comparison.percentageChange > 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : comparison.percentageChange < 0 ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : null}
                    {comparison.percentageChange > 0 ? '+' : ''}{comparison.percentageChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {trend && trend.trend !== 'stable' && (
              <div className="flex-1 min-w-[160px] rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                <div className={`flex items-center gap-2 ${trendColor}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{trendLabel}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
