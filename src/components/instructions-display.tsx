import { parseInstructions } from '@/lib/instructions-utils'
import { cn } from '@/lib/utils'

interface InstructionsDisplayProps {
  instructions?: string
  className?: string
}

export function InstructionsDisplay({ instructions, className }: InstructionsDisplayProps) {
  if (!instructions) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum modo de preparo cadastrado
      </p>
    )
  }

  const parsed = parseInstructions(instructions)

  if (parsed.isStepByStep) {
    return (
      <ol className={cn("space-y-3", className)}>
        {parsed.steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="font-semibold text-primary min-w-[2rem]">
              {index + 1}.
            </span>
            <span className="text-sm flex-1">{step}</span>
          </li>
        ))}
      </ol>
    )
  }

  // Plain text format (legacy)
  return (
    <p className={cn("whitespace-pre-wrap text-sm", className)}>
      {parsed.plainText}
    </p>
  )
}
