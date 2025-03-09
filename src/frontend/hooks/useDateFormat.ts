import { useSettings } from '@/frontend/context/SettingsContext'
import { formatDisplayDate, toISODateString, parseFormDate, toDateObject } from '@/frontend/lib/dateUtils'
import { useMemo } from 'react'

/**
 * Hook for date formatting that automatically uses the user's locale settings.
 * Provides a convenient wrapper around date utility functions.
 * 
 * @returns Object containing date formatting functions
 */
export function useDateFormat() {
  const { settings } = useSettings()
  
  return useMemo(() => ({
    /**
     * Format a date for display using the user's locale settings
     * @param value - Any value that might represent a date
     * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
     */
    formatDate: (value: unknown, options?: Intl.DateTimeFormatOptions) => 
      formatDisplayDate(value, settings.number_locale, options),
    
    /**
     * Convert a date to ISO string format (YYYY-MM-DD)
     */
    toISOString: toISODateString,
    
    /**
     * Parse a date from a form input, setting time to midnight UTC
     */
    parseFormDate: parseFormDate,
    
    /**
     * Convert any date-like value to a Date object
     */
    toDateObject: toDateObject,
  }), [settings.number_locale])
} 