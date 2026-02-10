'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { historyApi, PriceHistoryEntry } from '@/lib/api'
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

  useEffect(() => {
    if (!entityId) return
    let cancelled = false
    historyApi
      .getHistory(entityType, entityId)
      .then((res) => { if (!cancelled) setEntries(res.data.data) })
      .catch(() => { if (!cancelled) setEntries([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entityType, entityId])

  if (loading) return null

  // Filtrar apenas os campos solicitados
  const relevantEntries = entries.filter((e) => fields.includes(e.field))
  if (relevantEntries.length < 2) return null

  // Construir data points por timestamp
  // Cada campo tem seus próprios data points
  const dataPointsByField = new Map<string, Array<{ date: string; value: number }>>()

  for (const field of fields) {
    const fieldEntries = relevantEntries.filter((e) => e.field === field)
    if (fieldEntries.length === 0) continue

    const points: Array<{ date: string; value: number }> = []
    // Adicionar ponto inicial (oldValue do primeiro entry)
    const first = fieldEntries[0]
    points.push({
      date: new Date(new Date(first.createdAt).getTime() - 1000).toISOString(),
      value: first.oldValue,
    })
    // Adicionar cada mudança
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

  const chartData = sortedTimestamps.map((ts) => {
    const point: Record<string, any> = {
      date: new Date(ts).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    for (const [field, points] of dataPointsByField) {
      // Find the last point at or before this timestamp
      let value: number | undefined
      for (const p of points) {
        if (p.date <= ts) value = p.value
      }
      if (value !== undefined) point[field] = value
    }

    return point
  })

  if (chartData.length < 2) return null

  const activeFields = Array.from(dataPointsByField.keys())

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title || 'Histórico de Preços'}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                  FIELD_LABELS[name] || name,
                ]) as any}
              />
              {activeFields.length > 1 && <Legend formatter={(v) => FIELD_LABELS[v] || v} />}
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
