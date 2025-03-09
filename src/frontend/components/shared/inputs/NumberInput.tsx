"use client"

import { useRef, useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'
import { Input } from '@/frontend/components/ui/input'
import { formatNumberInput } from '@/frontend/lib/transforms'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const focusTimeoutRef = useRef<number | null>(null)
  
  // Track if we're currently editing
  const [isEditing, setIsEditing] = useState(false)
  
  // Store the raw input value while editing
  const [rawValue, setRawValue] = useState(() => {
    if (value !== null && value !== undefined) {
      return formatNumberInput(value, settings.number_locale, decimals)
    }
    return ''
  })
  
  // Track if truncation occurred
  const [wasTruncated, setWasTruncated] = useState(false)
  
  // Update raw value when external value changes and not editing
  useEffect(() => {
    if (!isEditing && value !== undefined && value !== null) {
      setRawValue(formatNumberInput(value, settings.number_locale, decimals))
    }
  }, [value, settings.number_locale, decimals, isEditing])

  // Reset truncation highlight after a delay
  useEffect(() => {
    if (wasTruncated) {
      const timer = setTimeout(() => {
        setWasTruncated(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [wasTruncated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])

  // Handle focus
  const handleFocus = () => {
    setIsEditing(true)
    
    // Select all text on focus
    if (inputRef.current) {
      // Clear any existing timeout
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current)
      }
      
      // Set new timeout and store reference
      focusTimeoutRef.current = window.setTimeout(() => {
        inputRef.current?.select()
        focusTimeoutRef.current = null
      }, 0)
    }
  }

  // Handle input change - just validate basic format
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Allow empty input, digits, one decimal separator, and minus at start
    if (/^-?\d*[.,]?\d*$/.test(newValue)) {
      setRawValue(newValue)
    }
  }

  // Handle blur - parse and format
  const handleBlur = () => {
    setIsEditing(false)
    
    // Handle empty input
    if (!rawValue.trim()) {
      onChange(null)
      onBlur?.()
      return
    }
    
    // Parse the value using locale settings
    const normalizedValue = rawValue.replace(',', '.')
    let parsedValue = parseFloat(normalizedValue)
    
    // Check if valid number
    if (isNaN(parsedValue)) {
      setRawValue('')
      onChange(null)
      onBlur?.()
      return
    }
    
    // Apply constraints
    if (min !== undefined && parsedValue < min) {
      parsedValue = min
    }
    
    if (max !== undefined && parsedValue > max) {
      parsedValue = max
    }
    
    // Format for display and notify parent
    const formattedValue = formatNumberInput(parsedValue, settings.number_locale, decimals)
    
    // Check if truncation occurred by comparing decimal places
    const rawDecimalParts = normalizedValue.split('.')
    const hasMoreDecimals = rawDecimalParts.length > 1 && 
      rawDecimalParts[1].length > decimals
    
    if (hasMoreDecimals) {
      setWasTruncated(true)
    }
    
    setRawValue(formattedValue)
    onChange(parsedValue)
    onBlur?.()
  }

  // Get display value based on editing state
  const displayValue = isEditing ? rawValue : (
    value !== null && value !== undefined
      ? formatNumberInput(value, settings.number_locale, decimals)
      : rawValue
  )

  // Determine CSS classes based on state
  const inputClasses = `
    ${className}
    ${wasTruncated ? 'transition-colors duration-1000 bg-amber-100 dark:bg-amber-900/20' : ''}
  `.trim()

  return (
    <Input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={inputClasses}
      title={wasTruncated ? `Value rounded to ${decimals} decimal places` : undefined}
    />
  )
} 