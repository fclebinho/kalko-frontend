'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { X, Plus, ListOrdered, AlignLeft } from 'lucide-react'
import {
  parseInstructions,
  serializeInstructions,
  textToSteps,
  stepsToText
} from '@/lib/instructions-utils'
import { cn } from '@/lib/utils'

interface InstructionsInputProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function InstructionsInput({ value, onChange, className }: InstructionsInputProps) {
  const [mode, setMode] = useState<'steps' | 'text'>('steps')
  const [steps, setSteps] = useState<string[]>([])
  const [stepInput, setStepInput] = useState('')
  const [plainText, setPlainText] = useState('')
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [pendingMode, setPendingMode] = useState<'steps' | 'text'>('steps')

  // Initialize from value
  useEffect(() => {
    if (value) {
      const parsed = parseInstructions(value)
      if (parsed.isStepByStep) {
        setMode('steps')
        setSteps(parsed.steps)
        setPlainText(parsed.plainText)
      } else {
        setMode('text')
        setPlainText(parsed.plainText)
        setSteps(parsed.steps)
      }
    }
  }, []) // Only run on mount

  const handleAddStep = () => {
    if (stepInput.trim()) {
      const newSteps = [...steps, stepInput.trim()]
      setSteps(newSteps)
      onChange(serializeInstructions(newSteps))
      setStepInput('')
    }
  }

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps)
    onChange(serializeInstructions(newSteps))
  }

  const handleUpdateStep = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
    onChange(serializeInstructions(newSteps))
  }

  const handlePlainTextChange = (value: string) => {
    setPlainText(value)
    onChange(value)
  }

  const handleModeToggle = (newMode: 'steps' | 'text') => {
    if (newMode === mode) return

    // Check if there's content to convert
    const hasContent = mode === 'steps' ? steps.length > 0 : plainText.trim().length > 0

    if (hasContent) {
      setPendingMode(newMode)
      setShowConvertDialog(true)
    } else {
      setMode(newMode)
    }
  }

  const confirmModeChange = () => {
    if (pendingMode === 'text') {
      // Convert steps to plain text
      const text = stepsToText(steps)
      setPlainText(text)
      onChange(text)
    } else {
      // Convert plain text to steps
      const newSteps = textToSteps(plainText)
      setSteps(newSteps)
      onChange(serializeInstructions(newSteps))
    }
    setMode(pendingMode)
    setShowConvertDialog(false)
  }

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Mode Toggle */}
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => handleModeToggle('steps')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
              mode === 'steps'
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ListOrdered className="h-4 w-4" />
            <span>Passo a Passo</span>
            {mode === 'steps' && steps.length > 0 && (
              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                {steps.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleModeToggle('text')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
              mode === 'text'
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <AlignLeft className="h-4 w-4" />
            <span>Texto Livre</span>
          </button>
        </div>

        {/* Step-by-Step Mode */}
        {mode === 'steps' && (
          <div className="space-y-3">
            {/* Existing Steps */}
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="font-semibold text-primary mt-2 min-w-[2rem]">
                  {index + 1}.
                </span>
                <Textarea
                  value={step}
                  onChange={(e) => handleUpdateStep(index, e.target.value)}
                  placeholder={`Passo ${index + 1}`}
                  className="flex-1 min-h-[60px]"
                  rows={2}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                  className="mt-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Add New Step */}
            <div className="flex gap-2 items-start">
              <span className="font-semibold text-muted-foreground mt-2 min-w-[2rem]">
                {steps.length + 1}.
              </span>
              <Textarea
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddStep()
                  }
                }}
                placeholder="Digite o próximo passo e pressione Enter (Shift+Enter para nova linha)"
                className="flex-1 min-h-[60px]"
                rows={2}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddStep}
                disabled={!stepInput.trim()}
                className="mt-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {steps.length === 0 && !stepInput && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nenhum passo adicionado. Digite o primeiro passo acima.
              </p>
            )}
          </div>
        )}

        {/* Plain Text Mode */}
        {mode === 'text' && (
          <div>
            <Textarea
              value={plainText}
              onChange={(e) => handlePlainTextChange(e.target.value)}
              placeholder="Digite o modo de preparo completo..."
              className="min-h-[200px]"
              rows={10}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use quebras de linha para separar os passos
            </p>
          </div>
        )}
      </div>

      {/* Conversion Confirmation Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter formato?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === 'text' ? (
                <>
                  Você tem <strong>{steps.length} passos</strong> cadastrados.
                  Deseja convertê-los para texto livre?
                  {' '}Os passos serão separados por linha dupla.
                </>
              ) : (
                <>
                  O texto será dividido em passos automaticamente.
                  {' '}Você poderá ajustar após a conversão.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeChange}>
              Converter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
