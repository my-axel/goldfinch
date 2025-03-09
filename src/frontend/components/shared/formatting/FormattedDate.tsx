"use client"

import { useState, useEffect } from 'react'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'

interface FormattedDateProps {
  value: Date | string | null | undefined
  className?: string
  format?: Intl.DateTimeFormatOptions
}

/**
 * FormattedDate component for displaying date values with proper formatting.
 * Uses client-side formatting to prevent hydration mismatches.
 * Automatically uses user settings through the useDateFormat hook.
 * 
 * @component
 * @example
 * // Basic usage with Date object
 * <FormattedDate value={new Date()} />
 * 
 * @example
 * // With string date
 * <FormattedDate value="2023-05-15" />
 * 
 * @example
 * // With custom format
 * <FormattedDate value={new Date()} format={{ day: 'numeric', month: 'short' }} />
 */
export function FormattedDate({ 
  value, 
  className = '',
  format
}: FormattedDateProps) {
  const [formatted, setFormatted] = useState('')
  const { formatDate } = useDateFormat()

  useEffect(() => {
    if (!value) {
      setFormatted('')
      return
    }
    
    setFormatted(formatDate(value, format))
  }, [value, formatDate, format])

  return <span className={className}>{formatted}</span>
} 