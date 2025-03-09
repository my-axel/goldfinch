"use client"

import { NumberInput } from './NumberInput'

interface PercentInputProps extends Omit<React.ComponentProps<typeof NumberInput>, 'prefix' | 'suffix'> {
  showSymbol?: boolean
}

/**
 * PercentInput component for handling percentage input.
 * Extends NumberInput component with percentage-specific features.
 * Values are stored as decimals (0.05 for 5%) but displayed as percentages (5%).
 * 
 * @component
 * @example
 * // Basic usage (displays 5% for value 0.05)
 * <PercentInput 
 *   value={0.05} 
 *   onChange={setValue} 
 * />
 */
export function PercentInput({ 
  value, 
  onChange,
  showSymbol = true,
  decimals = 1,
  min,
  max,
  className = '',
  ...props
}: PercentInputProps) {
  return (
    <div className="relative">
      <NumberInput
        {...props}
        // Display value as percentage
        value={value !== null && value !== undefined ? value * 100 : null}
        // Store value as decimal
        onChange={newValue => onChange(newValue !== null ? newValue / 100 : null)}
        decimals={decimals}
        // Convert min/max to percentage for display
        min={min !== undefined ? min * 100 : undefined}
        max={max !== undefined ? max * 100 : undefined}
        className={`${className} ${showSymbol ? 'pr-7' : ''}`}
      />
      
      {showSymbol && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          %
        </span>
      )}
    </div>
  )
} 