"use client"

import { useSettings } from '@/frontend/context/SettingsContext'
import { NumberInput } from './NumberInput'
import { getCurrencySymbol, getDefaultCurrencyPosition } from '@/frontend/lib/transforms'

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
  ...props
}: CurrencyInputProps) {
  const { settings } = useSettings()
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)
  const currencyPosition = getDefaultCurrencyPosition(settings.number_locale)
  
  const symbolClassName = showSymbol 
    ? currencyPosition === 'prefix' 
      ? 'pl-7' 
      : 'pr-7'
    : ''
  
  return (
    <div className="relative">
      {showSymbol && currencyPosition === 'prefix' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
      
      <NumberInput
        {...props}
        decimals={decimals}
        className={`${className} ${symbolClassName}`}
      />
      
      {showSymbol && currencyPosition === 'suffix' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
    </div>
  )
} 