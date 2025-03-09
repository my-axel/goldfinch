"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/frontend/context/SettingsContext'

interface FormattedEnumProps<T> {
  value: T
  formatMap: Record<string | number, string>
  defaultValue?: string
  className?: string
}

/**
 * Generic component for formatting enum values.
 * Uses client-side formatting to prevent hydration mismatches.
 * 
 * @component
 * @example
 * // Basic usage with an enum
 * <FormattedEnum 
 *   value={MyEnum.VALUE} 
 *   formatMap={{ [MyEnum.VALUE]: 'Formatted Value' }} 
 * />
 * 
 * @example
 * // With custom styling and default value
 * <FormattedEnum 
 *   value={status} 
 *   formatMap={statusFormatMap} 
 *   defaultValue="Unknown"
 *   className="font-medium" 
 * />
 */
export function FormattedEnum<T extends string | number>({ 
  value, 
  formatMap,
  defaultValue = '',
  className = '' 
}: FormattedEnumProps<T>) {
  const [formatted, setFormatted] = useState('')
  const { settings } = useSettings()

  useEffect(() => {
    if (value === undefined || value === null) {
      setFormatted(defaultValue)
      return
    }

    // Get the formatted value from the map or use the default
    const formattedValue = formatMap[value] || String(value).toLowerCase()
    setFormatted(formattedValue)
  }, [value, formatMap, defaultValue, settings.ui_locale])

  return <span className={className}>{formatted}</span>
} 