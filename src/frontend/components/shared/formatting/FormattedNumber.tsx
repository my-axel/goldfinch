"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'
import { formatNumber } from '@/frontend/lib/transforms'

interface FormattedNumberProps {
  value: number | null | undefined
  decimals?: number
  compact?: boolean
  className?: string
}

/**
 * FormattedNumber component for displaying number values with proper formatting.
 * Uses client-side formatting to prevent hydration mismatches.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage
 * <FormattedNumber value={1234.56} />
 * 
 * @example
 * // With custom decimals
 * <FormattedNumber value={1234.56} decimals={0} />
 * 
 * @example
 * // With compact notation
 * <FormattedNumber value={1234567} compact={true} /> // Displays as 1.2M or similar
 */
export function FormattedNumber({ 
  value, 
  decimals = 2, 
  compact = false,
  className = '' 
}: FormattedNumberProps) {
  const [formatted, setFormatted] = useState('')
  const { settings } = useSettings()

  useEffect(() => {
    if (value === null || value === undefined) {
      setFormatted('')
      return
    }

    const result = formatNumber(value, {
      locale: settings.number_locale,
      decimals,
      compact
    })

    setFormatted(result.formatted)
  }, [value, settings.number_locale, decimals, compact])

  return <span className={className}>{formatted}</span>
} 