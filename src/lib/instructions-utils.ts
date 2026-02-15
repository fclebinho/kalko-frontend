/**
 * Utilities for handling recipe instructions in both formats:
 * - Step-by-step (JSON array)
 * - Plain text (legacy format)
 */

export interface ParsedInstructions {
  isStepByStep: boolean
  steps: string[]
  plainText: string
}

/**
 * Check if a string is a valid JSON array of strings
 */
export function isJsonArray(str?: string): boolean {
  if (!str || typeof str !== 'string') return false

  const trimmed = str.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'string')
  } catch {
    return false
  }
}

/**
 * Parse instructions from either format
 * Returns structured data with format detection
 */
export function parseInstructions(instructions?: string): ParsedInstructions {
  if (!instructions) {
    return {
      isStepByStep: false,
      steps: [],
      plainText: ''
    }
  }

  // Try to parse as JSON array
  if (isJsonArray(instructions)) {
    try {
      const steps = JSON.parse(instructions) as string[]
      return {
        isStepByStep: true,
        steps: steps.filter(step => step.trim().length > 0),
        plainText: steps.join('\n\n')
      }
    } catch {
      // Fall through to plain text
    }
  }

  // Treat as plain text
  return {
    isStepByStep: false,
    steps: instructions
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0),
    plainText: instructions
  }
}

/**
 * Serialize array of steps to JSON string for storage
 */
export function serializeInstructions(steps: string[]): string {
  const validSteps = steps.filter(step => step.trim().length > 0)
  return JSON.stringify(validSteps)
}

/**
 * Convert plain text to steps (smart splitting)
 */
export function textToSteps(text: string): string[] {
  if (!text) return []

  // Split by double newline first (paragraphs)
  let steps = text.split('\n\n').map(s => s.trim()).filter(s => s.length > 0)

  // If only one paragraph, try splitting by single newline
  if (steps.length === 1) {
    steps = text.split('\n').map(s => s.trim()).filter(s => s.length > 0)
  }

  return steps
}

/**
 * Convert steps array to plain text
 */
export function stepsToText(steps: string[]): string {
  return steps.filter(s => s.trim().length > 0).join('\n\n')
}
