"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'
import { formatPercent } from '@/frontend/lib/transforms'

interface FormattedPercentProps {
  value: number | null | undefined
  decimals?: number
  className?: string
}

/**
 * FormattedPercent component for displaying percentage values with proper formatting.
 * Uses client-side formatting to prevent hydration mismatches.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage (0.05 displays as 5%)
 * <FormattedPercent value={0.05} />
 * 
 * @example
 * // With custom decimals
 * <FormattedPercent value={0.0567} decimals={1} /> // Displays as 5.7%
 */
export function FormattedPercent({ 
  value, 
  decimals = 1, 
  className = '' 
}: FormattedPercentProps) {
  const [formatted, setFormatted] = useState('')
  const { settings } = useSettings()

  useEffect(() => {
    if (value === null || value === undefined) {
      setFormatted('')
      return
    }

    const result = formatPercent(value, {
      locale: settings.number_locale,
      decimals
    })

    setFormatted(result.formatted)
  }, [value, settings.number_locale, decimals])

  return <span className={className}>{formatted}</span>
} 