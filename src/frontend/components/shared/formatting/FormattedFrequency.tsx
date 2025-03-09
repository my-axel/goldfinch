"use client"

import { FormattedEnum } from './FormattedEnum'
import { ContributionFrequency } from '@/frontend/types/pension'

// Define the mapping once
const frequencyFormatMap: Record<ContributionFrequency, string> = {
  [ContributionFrequency.MONTHLY]: 'monthly',
  [ContributionFrequency.QUARTERLY]: 'quarterly',
  [ContributionFrequency.SEMI_ANNUALLY]: 'semi-annually',
  [ContributionFrequency.ANNUALLY]: 'annually',
  [ContributionFrequency.ONE_TIME]: 'one-time'
}

interface FormattedFrequencyProps {
  value: ContributionFrequency
  className?: string
}

/**
 * Component for formatting ContributionFrequency enum values.
 * Uses the generic FormattedEnum component with a predefined format map.
 * 
 * @component
 * @example
 * // Basic usage
 * <FormattedFrequency value={ContributionFrequency.MONTHLY} />
 * 
 * @example
 * // With custom styling
 * <FormattedFrequency value={frequency} className="text-muted-foreground" />
 */
export function FormattedFrequency({ 
  value, 
  className = '' 
}: FormattedFrequencyProps) {
  return (
    <FormattedEnum
      value={value}
      formatMap={frequencyFormatMap}
      defaultValue="unknown"
      className={className}
    />
  )
} 