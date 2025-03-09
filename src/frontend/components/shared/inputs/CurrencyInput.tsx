"use client"

import { useSettings } from '@/frontend/context/SettingsContext'
import { NumberInput } from './NumberInput'
import { getCurrencySymbol, getDefaultCurrencyPosition } from '@/frontend/lib/transforms'
import { useState, useEffect } from 'react'

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof NumberInput>, 'prefix' | 'suffix'> {
  showSymbol?: boolean
}

/**
 * CurrencyInput component for handling currency input.
 * Extends NumberInput component with currency symbol display.
 * 
 * @component
 * @example
 * // Basic usage
 * <CurrencyInput 
 *   value={1234.56} 
 *   onChange={setValue} 
 * />
 */
export function CurrencyInput({ 
  showSymbol = true,
  decimals = 2,
  className = '',
  value,
  ...props
}: CurrencyInputProps) {
  const { settings } = useSettings()
  const [shouldShowSymbol, setShouldShowSymbol] = useState(false)
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [currencyPosition, setCurrencyPosition] = useState<'prefix' | 'suffix'>('prefix')
  
  // Initialize currency symbol and position after hydration
  useEffect(() => {
    setCurrencySymbol(getCurrencySymbol(settings.number_locale, settings.currency))
    setCurrencyPosition(getDefaultCurrencyPosition(settings.number_locale))
    // Only show symbol if there's a value and showSymbol is true
    setShouldShowSymbol(showSymbol && value !== undefined && value !== null)
  }, [settings, showSymbol, value])
  
  const symbolClassName = shouldShowSymbol 
    ? currencyPosition === 'prefix' 
      ? 'pl-7' 
      : 'pr-7'
    : ''
  
  return (
    <div className="relative">
      {shouldShowSymbol && currencyPosition === 'prefix' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
      
      <NumberInput
        {...props}
        value={value}
        decimals={decimals}
        className={`${className} ${symbolClassName}`}
      />
      
      {shouldShowSymbol && currencyPosition === 'suffix' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
    </div>
  )
} 