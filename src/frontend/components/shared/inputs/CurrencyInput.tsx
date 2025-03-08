"use client"

import { useSettings } from '@/frontend/context/SettingsContext'
import { NumberInput } from './NumberInput'
import { getCurrencySymbol, getDefaultCurrencyPosition } from '@/frontend/lib/transforms'

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof NumberInput>, 'prefix' | 'suffix'> {
  showSymbol?: boolean
}

/**
 * CurrencyInput component for handling locale-specific currency input.
 * Extends NumberInput component with currency-specific features.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage
 * <CurrencyInput 
 *   value={value} 
 *   onChange={setValue} 
 * />
 * 
 * @example
 * // With min constraint
 * <CurrencyInput 
 *   value={value} 
 *   onChange={setValue} 
 *   min={0} 
 * />
 */
export function CurrencyInput({ 
  value, 
  onChange, 
  showSymbol = true,
  decimals = 2,
  className = '',
  ...props
}: CurrencyInputProps) {
  const { settings } = useSettings()
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)
  const currencyPosition = getDefaultCurrencyPosition(settings.number_locale)
  
  return (
    <div className="relative">
      {showSymbol && currencyPosition === 'prefix' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
      
      <NumberInput
        value={value}
        onChange={onChange}
        decimals={decimals}
        className={`${className} ${showSymbol && currencyPosition === 'prefix' ? 'pl-7' : ''}`}
        {...props}
      />
      
      {showSymbol && currencyPosition === 'suffix' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencySymbol}
        </span>
      )}
    </div>
  )
} 