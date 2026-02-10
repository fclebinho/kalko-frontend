import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const WEIGHT_VOLUME_UNITS = ['g', 'kg', 'ml', 'l']

export function isWeightVolumeUnit(yieldUnit?: string | null): boolean {
  return !!yieldUnit && WEIGHT_VOLUME_UNITS.includes(yieldUnit)
}
