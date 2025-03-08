"use client"

import { NumberInput } from './NumberInput'

interface PercentInputProps extends Omit<React.ComponentProps<typeof NumberInput>, 'prefix' | 'suffix'> {
  showSymbol?: boolean
}

/**
 * PercentInput component for handling locale-specific percentage input.
 * Extends NumberInput component with percentage-specific features.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage (input 5 for 5%)
 * <PercentInput 
 *   value={value} 
 *   onChange={setValue} 
 * />
 * 
 * @example
 * // With min/max constraints
 * <PercentInput 
 *   value={value} 
 *   onChange={setValue} 
 *   min={0} 
 *   max={100} 
 * />
 */
export function PercentInput({ 
  value, 
  onChange, 
  showSymbol = true,
  decimals = 2,
  className = '',
  ...props
}: PercentInputProps) {
  // Convert decimal value (0.05) to percentage (5) for display
  const displayValue = value !== null && value !== undefined 
    ? value * 100 
    : value
  
  // Convert percentage input (5) back to decimal (0.05) for storage
  const handleChange = (newValue: number | null) => {
    if (newValue !== null) {
      onChange(newValue / 100)
    } else {
      onChange(null)
    }
  }
  
  return (
    <div className="relative">
      <NumberInput
        value={displayValue}
        onChange={handleChange}
        decimals={decimals}
        className={`${className} ${showSymbol ? 'pr-7' : ''}`}
        {...props}
      />
      
      {showSymbol && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          %
        </span>
      )}
    </div>
  )
} 