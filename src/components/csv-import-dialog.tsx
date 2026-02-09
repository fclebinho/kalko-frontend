'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ingredientsApi, BulkImportReport } from '@/lib/api'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Download } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ColumnMapping {
  name: string
  quantity: string
  cost: string
  unit: string
  category: string
  supplier: string
}

const REQUIRED_FIELDS = ['name', 'quantity', 'cost', 'unit'] as const
const OPTIONAL_FIELDS = ['category', 'supplier'] as const
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome *',
  quantity: 'Quantidade *',
  cost: 'Custo *',
  unit: 'Unidade *',
  category: 'Categoria',
  supplier: 'Fornecedor',
}

const VALID_UNITS = ['g', 'ml', 'un']

// Auto-detect column mappings from common header names
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['nome', 'name', 'ingrediente', 'ingredient', 'produto', 'product'],
  quantity: ['quantidade', 'quantity', 'qtd', 'qtde', 'quant'],
  cost: ['custo', 'cost', 'preco', 'preço', 'price', 'valor', 'value'],
  unit: ['unidade', 'unit', 'un', 'medida', 'measure'],
  category: ['categoria', 'category', 'cat', 'tipo', 'type'],
  supplier: ['fornecedor', 'supplier', 'fornec'],
}

function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const matchIndex = normalizedHeaders.findIndex((h) => aliases.includes(h))
    if (matchIndex !== -1) {
      mapping[field as keyof ColumnMapping] = headers[matchIndex]
    }
  }

  return mapping
}

interface ParsedRow {
  name: string
  quantity: number
  cost: number
  unit: string
  category?: string
  supplier?: string
  errors: string[]
  rowIndex: number
}

function validateRow(row: Record<string, string>, mapping: ColumnMapping, rowIndex: number): ParsedRow {
  const errors: string[] = []

  const name = (row[mapping.name] || '').trim()
  if (!name || name.length < 2) errors.push('Nome deve ter pelo menos 2 caracteres')
  if (name.length > 100) errors.push('Nome deve ter no máximo 100 caracteres')

  const quantity = parseFloat(row[mapping.quantity])
  if (isNaN(quantity) || quantity <= 0) errors.push('Quantidade deve ser um número positivo')

  const cost = parseFloat(row[mapping.cost])
  if (isNaN(cost) || cost <= 0) errors.push('Custo deve ser um número positivo')

  const rawUnit = (row[mapping.unit] || '').trim().toLowerCase()
  const unit = rawUnit
  if (!VALID_UNITS.includes(unit)) errors.push(`Unidade inválida: "${rawUnit}". Use: g, ml, un`)

  const category = mapping.category ? (row[mapping.category] || '').trim() || undefined : undefined
  const supplier = mapping.supplier ? (row[mapping.supplier] || '').trim() || undefined : undefined

  return { name, quantity: quantity || 0, cost: cost || 0, unit, category, supplier, errors, rowIndex }
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '', quantity: '', cost: '', unit: '', category: '', supplier: '',
  })
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [onDuplicate, setOnDuplicate] = useState<'skip' | 'update'>('skip')
  const [importResult, setImportResult] = useState<BulkImportReport | null>(null)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState('')

  const resetState = useCallback(() => {
    setStep('upload')
    setHeaders([])
    setRawData([])
    setMapping({ name: '', quantity: '', cost: '', unit: '', category: '', supplier: '' })
    setParsedRows([])
    setOnDuplicate('skip')
    setImportResult(null)
    setImporting(false)
    setFileName('')
  }, [])

  const handleFileUpload = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB')
      return
    }

    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          toast.error('Erro ao ler arquivo CSV')
          return
        }

        const data = results.data as Record<string, string>[]
        if (data.length === 0) {
          toast.error('Arquivo CSV vazio')
          return
        }

        if (data.length > 500) {
          toast.error('Máximo de 500 linhas permitido')
          return
        }

        const fileHeaders = results.meta.fields || []
        setHeaders(fileHeaders)
        setRawData(data)

        // Auto-detect mapping
        const autoMapping = autoDetectMapping(fileHeaders)
        setMapping({
          name: autoMapping.name || '',
          quantity: autoMapping.quantity || '',
          cost: autoMapping.cost || '',
          unit: autoMapping.unit || '',
          category: autoMapping.category || '',
          supplier: autoMapping.supplier || '',
        })

        setStep('mapping')
      },
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        handleFileUpload(file)
      } else {
        toast.error('Por favor, selecione um arquivo .csv')
      }
    },
    [handleFileUpload]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleGoToPreview = useCallback(() => {
    // Validate mapping has required fields
    for (const field of REQUIRED_FIELDS) {
      if (!mapping[field]) {
        toast.error(`Campo obrigatório não mapeado: ${FIELD_LABELS[field]}`)
        return
      }
    }

    // Parse and validate all rows
    const rows = rawData.map((row, i) => validateRow(row, mapping, i + 1))
    setParsedRows(rows)
    setStep('preview')
  }, [rawData, mapping])

  const handleImport = useCallback(async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0)
    if (validRows.length === 0) {
      toast.error('Nenhuma linha válida para importar')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      const response = await ingredientsApi.bulkCreate({
        ingredients: validRows.map((r) => ({
          name: r.name,
          quantity: r.quantity,
          cost: r.cost,
          unit: r.unit,
          ...(r.category && { category: r.category }),
          ...(r.supplier && { supplier: r.supplier }),
        })),
        onDuplicate,
      })

      setImportResult(response.data)
      setStep('complete')

      const { report } = response.data
      toast.success(
        `Importação concluída: ${report.created} criados, ${report.updated} atualizados, ${report.skipped} ignorados`
      )
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao importar ingredientes'
      toast.error(message)
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }, [parsedRows, onDuplicate])

  const handleClose = useCallback(() => {
    if (step === 'complete') {
      onImportComplete()
    }
    onOpenChange(false)
    setTimeout(resetState, 300)
  }, [step, onImportComplete, onOpenChange, resetState])

  const downloadTemplate = useCallback(() => {
    const csv = 'nome,quantidade,custo,unidade,categoria,fornecedor\nFarinha de Trigo,1000,5.50,g,Farinha,Padaria Silva\nAçúcar Cristal,1000,3.20,g,Açúcar,Mercado Local\nOvos,12,8.00,un,Ovos,Granja Santa Maria\nLeite Integral,1000,4.50,ml,Laticínios,Cooperativa'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-ingredientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importar Ingredientes via CSV'}
            {step === 'mapping' && 'Mapear Colunas'}
            {step === 'preview' && 'Pré-visualização'}
            {step === 'importing' && 'Importando...'}
            {step === 'complete' && 'Importação Concluída'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Selecione um arquivo CSV com os dados dos ingredientes'}
            {step === 'mapping' && `Arquivo: ${fileName} (${rawData.length} linhas)`}
            {step === 'preview' && `${validCount} válidos, ${errorCount} com erros`}
            {step === 'importing' && 'Aguarde enquanto os ingredientes são importados...'}
            {step === 'complete' && 'Veja o resumo da importação abaixo'}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Arraste um arquivo CSV ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Máximo: 500 linhas, 5MB</p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Baixar template CSV
            </Button>
          </div>
        )}

        {/* Step: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associe as colunas do seu CSV aos campos do sistema.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_FIELDS.map((field) => (
                <div key={field}>
                  <Label className="text-sm">{FIELD_LABELS[field]}</Label>
                  <Select
                    value={mapping[field] || '_none'}
                    onValueChange={(v) =>
                      setMapping({ ...mapping, [field]: v === '_none' ? '' : v })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">-- Não mapear --</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" /> {validCount} válidos
              </span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" /> {errorCount} com erros
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Duplicados:</Label>
              <Select value={onDuplicate} onValueChange={(v) => setOnDuplicate(v as 'skip' | 'update')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Ignorar existentes</SelectItem>
                  <SelectItem value="update">Atualizar existentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Un.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 20).map((row) => (
                    <TableRow key={row.rowIndex} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{row.rowIndex}</TableCell>
                      <TableCell className="text-sm">{row.name || '-'}</TableCell>
                      <TableCell className="text-sm">{row.quantity || '-'}</TableCell>
                      <TableCell className="text-sm">{row.cost ? `R$ ${row.cost.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-sm">{row.unit || '-'}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <span className="text-xs text-red-600">{row.errors.join('; ')}</span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 20 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  Mostrando 20 de {parsedRows.length} linhas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <FileSpreadsheet className="h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-sm text-muted-foreground">Importando {validCount} ingredientes...</p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.report.created}</p>
                <p className="text-xs text-muted-foreground">Criados</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{importResult.report.updated}</p>
                <p className="text-xs text-muted-foreground">Atualizados</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">{importResult.report.skipped}</p>
                <p className="text-xs text-muted-foreground">Ignorados</p>
              </div>
            </div>

            {importResult.details.skipped.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-1">Ignorados:</p>
                <ul className="text-muted-foreground space-y-1">
                  {importResult.details.skipped.slice(0, 5).map((s, i) => (
                    <li key={i}>- {s.name}: {s.reason}</li>
                  ))}
                  {importResult.details.skipped.length > 5 && (
                    <li>... e mais {importResult.details.skipped.length - 5}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleGoToPreview}>
                Pré-visualizar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} ingredientes
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
