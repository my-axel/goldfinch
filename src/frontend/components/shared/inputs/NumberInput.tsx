"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'
import { Input } from '@/frontend/components/ui/input'
import { 
  formatNumberInput, 
  parseNumber, 
  getDecimalSeparator 
} from '@/frontend/lib/transforms'

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null | undefined
  onChange: (value: number | null) => void
  onBlur?: () => void
  decimals?: number
  min?: number
  max?: number
}

/**
 * NumberInput component for handling locale-specific number input.
 * Extends shadcn/ui Input component.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage
 * <NumberInput 
 *   value={value} 
 *   onChange={setValue} 
 * />
 * 
 * @example
 * // With min/max constraints
 * <NumberInput 
 *   value={value} 
 *   onChange={setValue} 
 *   min={0} 
 *   max={100} 
 * />
 */
export function NumberInput({ 
  value, 
  onChange, 
  onBlur,
  decimals = 2,
  min,
  max,
  className = '',
  ...props
}: NumberInputProps) {
  const { settings } = useSettings()
  const [localValue, setLocalValue] = useState('')
  const decimalSeparator = getDecimalSeparator(settings.number_locale)

  // Initialize input state when value changes
  useEffect(() => {
    setLocalValue(formatNumberInput(value, settings.number_locale, decimals))
  }, [value, settings.number_locale, decimals])

  // Validate input format based on locale
  const isValidNumberFormat = (input: string): boolean => {
    if (!input) return true
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(input)
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (isValidNumberFormat(newValue)) {
      setLocalValue(newValue)
      const parsedValue = parseNumber(newValue, settings.number_locale)
      
      // Apply min/max constraints if provided
      if (parsedValue !== null) {
        if (min !== undefined && parsedValue < min) return
        if (max !== undefined && parsedValue > max) return
      }
      
      onChange(parsedValue)
    }
  }

  // Handle input blur
  const handleBlur = () => {
    const parsedValue = parseNumber(localValue, settings.number_locale)
    if (parsedValue !== null) {
      setLocalValue(formatNumberInput(parsedValue, settings.number_locale, decimals))
      onChange(parsedValue)
    } else {
      setLocalValue('')
      onChange(null)
    }
    if (onBlur) onBlur()
  }

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      inputMode="decimal"
      {...props}
    />
  )
} 