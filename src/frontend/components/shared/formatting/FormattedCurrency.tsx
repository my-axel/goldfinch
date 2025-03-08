"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'
import { formatCurrency } from '@/frontend/lib/transforms'

interface FormattedCurrencyProps {
  value: number | null | undefined
  decimals?: number
  className?: string
}

/**
 * FormattedCurrency component for displaying currency values with proper formatting.
 * Uses client-side formatting to prevent hydration mismatches.
 * Automatically uses user settings from SettingsContext.
 * 
 * @component
 * @example
 * // Basic usage
 * <FormattedCurrency value={1234.56} />
 * 
 * @example
 * // With custom decimals
 * <FormattedCurrency value={1234.56} decimals={0} />
 * 
 * @example
 * // With custom styling
 * <FormattedCurrency value={1234.56} className="text-lg font-bold text-green-600" />
 */
export function FormattedCurrency({ 
  value, 
  decimals = 2, 
  className = '' 
}: FormattedCurrencyProps) {
  const [formatted, setFormatted] = useState('')
  const { settings } = useSettings()

  useEffect(() => {
    if (value === null || value === undefined) {
      setFormatted('')
      return
    }

    const result = formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals
    })

    setFormatted(result.formatted)
  }, [value, settings.number_locale, settings.currency, decimals])

  return <span className={className}>{formatted}</span>
} 