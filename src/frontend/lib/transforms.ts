/**
 * Formatting Utilities
 * 
 * This file contains utilities for formatting and parsing numbers, currencies, percentages, and dates.
 * It provides consistent formatting across the application and handles locale-specific formatting.
 * 
 * Key functions:
 * - formatCurrency: Formats a number as currency with proper locale and symbol
 * - formatNumber: Formats a number with proper locale
 * - formatPercent: Formats a number as a percentage
 * - parseNumber: Parses a localized number string back to a number
 * - safeNumberValue: Safely handles null/undefined number values
 * - formatNumberInput: Formats a number for input fields with proper locale-specific decimal separators
 * 
 * For date handling, prefer functions from dateUtils.ts over the deprecated date functions in this file.
 */

/**
 * Options for formatting numbers, currencies, and percentages
 */
export interface FormatOptions {
  locale?: string;              // The locale to use for formatting (e.g., 'en-US', 'de-DE')
  style?: 'decimal' | 'currency' | 'percent';  // The formatting style
  currency?: string;            // The currency code to use (e.g., 'USD', 'EUR')
  decimals?: number;            // The number of decimal places to show
  compact?: boolean;            // Whether to use compact notation (e.g., 1K, 1M)
  currencyPosition?: 'prefix' | 'suffix';  // Where to place the currency symbol
}

/**
 * Result of formatting a number, containing both the formatted string and the original value
 */
export interface SafeNumber {
  formatted: string;    // Display value (e.g., "1.234,56 €")
  value: number;        // Raw value (e.g., 1234.56)
}

/**
 * @deprecated Use types from dateUtils.ts instead. This will be removed when all components are migrated.
 * Result of formatting a date, containing both the formatted string and the ISO date string
 */
export interface SafeDate {
  formatted: string;    // Display value (e.g., "23.02.2024")
  value: string;        // Backend value (e.g., "2024-02-23")
}

/**
 * Safely handles potentially null/undefined number values
 * Returns the parsed number or undefined if the value is null/undefined
 * 
 * @param value - The number value to check, which might be null or undefined
 * @returns The number value, or undefined if the input was null or undefined
 * 
 * @example
 * // Returns undefined
 * safeNumberValue(null)
 * 
 * @example
 * // Returns 123
 * safeNumberValue(123)
 */
export function safeNumberValue(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return Number(value);
}

/**
 * Formats a number for input fields with proper locale-specific decimal separators
 * 
 * @param value - The number value to format
 * @param locale - The locale to use for formatting (e.g., 'en-US', 'de-DE')
 * @param decimals - The number of decimal places to show (optional)
 * @returns A string representation of the number with proper decimal separator
 * 
 * @example
 * // Returns "123,45" for German locale
 * formatNumberInput(123.45, 'de-DE')
 * 
 * @example
 * // Returns "123,450" for German locale with 3 decimals
 * formatNumberInput(123.45, 'de-DE', 3)
 * 
 * @example
 * // Returns "" for null input
 * formatNumberInput(null, 'en-US')
 */
export function formatNumberInput(value: number | null | undefined, locale: string, decimals?: number): string {
  const safeValue = safeNumberValue(value);
  if (safeValue === undefined) {
    return "";
  }
  
  const decimalSeparator = getDecimalSeparator(locale);
  
  // If decimals is specified, format with fixed decimal places
  if (decimals !== undefined) {
    // Use Intl.NumberFormat to ensure consistent decimal places
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false // Don't use thousand separators for input fields
    });
    return formatter.format(safeValue);
  }
  
  // Otherwise, just replace the decimal separator
  return safeValue.toString().replace('.', decimalSeparator);
}

/**
 * Gets the currency symbol for a given locale and currency
 * 
 * @param locale - The locale to use (e.g., 'en-US', 'de-DE')
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @returns The currency symbol for the given locale and currency
 * 
 * @example
 * // Returns "$"
 * getCurrencySymbol('en-US', 'USD')
 * 
 * @example
 * // Returns "€"
 * getCurrencySymbol('de-DE', 'EUR')
 */
export function getCurrencySymbol(locale: string, currency: string): string {
  try {
    return (0).toLocaleString(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim()
  } catch (error) {
    console.error('Error getting currency symbol:', error)
    return currency // Fallback to currency code
  }
}

/**
 * Gets the default currency position for a given locale
 * 
 * @param locale - The locale to use (e.g., 'en-US', 'de-DE')
 * @returns The default position of the currency symbol ('prefix' or 'suffix')
 * 
 * @example
 * // Returns "prefix" for US locale (e.g., "$100")
 * getDefaultCurrencyPosition('en-US')
 * 
 * @example
 * // Returns "suffix" for many European locales (e.g., "100 €")
 * getDefaultCurrencyPosition('de-DE')
 */
export function getDefaultCurrencyPosition(locale: string): 'prefix' | 'suffix' {
  try {
    const formatted = (0).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD', // Use USD as a reference
    });
    return formatted.startsWith('$') ? 'prefix' : 'suffix';
  } catch (error) {
    console.error('Error detecting currency position:', error);
    return 'prefix'; // Default to prefix
  }
}

/**
 * Formats a currency value according to the given locale and position
 * 
 * @param value - The number value to format as currency
 * @param options - Formatting options (locale, currency, decimals, etc.)
 * @returns A SafeNumber object containing the formatted string and the original value
 * 
 * @example
 * // Returns { formatted: "$1,234.56", value: 1234.56 }
 * formatCurrency(1234.56, { locale: 'en-US', currency: 'USD' })
 * 
 * @example
 * // Returns { formatted: "1.234,56 €", value: 1234.56 }
 * formatCurrency(1234.56, { locale: 'de-DE', currency: 'EUR' })
 */
export function formatCurrency(value: number, options?: Omit<FormatOptions, 'style'>): SafeNumber {
  try {
    const locale = options?.locale || 'en';
    const currency = options?.currency || 'USD';
    const position = options?.currencyPosition || getDefaultCurrencyPosition(locale);
    const symbol = getCurrencySymbol(locale, currency);

    // Format number without currency
    const numberPart = new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.decimals ?? 2,
      maximumFractionDigits: options?.decimals ?? 2,
      notation: options?.compact ? 'compact' : 'standard',
      useGrouping: true,
    }).format(value);

    // Combine number and currency symbol based on position
    const formatted = position === 'prefix' 
      ? `${symbol}${numberPart}`
      : `${numberPart} ${symbol}`;

    return {
      formatted,
      value,
    };
  } catch (error) {
    console.error('Error formatting currency:', error);
    return {
      formatted: value.toString(),
      value,
    };
  }
}

/**
 * Formats a number according to the given locale and options
 * 
 * @param value - The number value to format
 * @param options - Formatting options (locale, style, decimals, etc.)
 * @returns A SafeNumber object containing the formatted string and the original value
 * 
 * @example
 * // Returns { formatted: "1,234.56", value: 1234.56 }
 * formatNumber(1234.56, { locale: 'en-US' })
 * 
 * @example
 * // Returns { formatted: "1.234,56", value: 1234.56 }
 * formatNumber(1234.56, { locale: 'de-DE' })
 */
export function formatNumber(value: number, options?: FormatOptions): SafeNumber {
  try {
    const formatted = new Intl.NumberFormat(options?.locale, {
      style: options?.style || 'decimal',
      currency: options?.currency,
      minimumFractionDigits: options?.decimals,
      maximumFractionDigits: options?.decimals,
      notation: options?.compact ? 'compact' : 'standard',
      useGrouping: true, // Always use thousand separators
    }).format(value);

    return {
      formatted,
      value,
    };
  } catch (error) {
    console.error('Error formatting number:', error);
    // Fallback to basic formatting
    return {
      formatted: value.toString(),
      value,
    };
  }
}

/**
 * Formats a percentage value according to the given locale
 * 
 * @param value - The number value to format as a percentage (e.g., 0.1 for 10%)
 * @param options - Formatting options (locale, decimals, etc.)
 * @returns A SafeNumber object containing the formatted string and the original value
 * 
 * @example
 * // Returns { formatted: "10%", value: 0.1 }
 * formatPercent(0.1, { locale: 'en-US' })
 * 
 * @example
 * // Returns { formatted: "10,0%", value: 0.1 }
 * formatPercent(0.1, { locale: 'de-DE', decimals: 1 })
 */
export function formatPercent(value: number, options?: Omit<FormatOptions, 'style'>): SafeNumber {
  return formatNumber(value, { ...options, style: 'percent' });
}

/**
 * @deprecated Use formatDisplayDate() from dateUtils.ts instead. This will be removed when all components are migrated.
 * Formats a date according to the given locale
 * 
 * @param date - The date to format (string or Date object)
 * @param options - Formatting options (locale)
 * @returns A SafeDate object containing the formatted string and the ISO date string
 * 
 * @example
 * // Returns { formatted: "02/23/2024", value: "2024-02-23" }
 * formatDate("2024-02-23", { locale: 'en-US' })
 * 
 * @example
 * // Returns { formatted: "23.02.2024", value: "2024-02-23" }
 * formatDate("2024-02-23", { locale: 'de-DE' })
 */
export function formatDate(date: string | Date, options?: Pick<FormatOptions, 'locale'>): SafeDate {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const formatted = new Intl.DateTimeFormat(options?.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);

    return {
      formatted,
      value: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    // Return original value if it's a valid ISO date, otherwise today's date
    const fallbackDate = typeof date === 'string' ? date : new Date().toISOString().split('T')[0];
    return {
      formatted: fallbackDate,
      value: fallbackDate,
    };
  }
}

/**
 * Parses a localized number string back to a number
 * 
 * @param input - The string to parse (e.g., "1.234,56" for German locale)
 * @param locale - The locale to use for parsing (e.g., 'de-DE')
 * @returns The parsed number value
 * 
 * @example
 * // Returns 1234.56
 * parseNumber("1,234.56", 'en-US')
 * 
 * @example
 * // Returns 1234.56
 * parseNumber("1.234,56", 'de-DE')
 */
export function parseNumber(input: string, locale: string): number {
  try {
    // If input is empty or just a decimal separator, return 0
    if (!input || input === '.' || input === ',') {
      return 0;
    }

    // Get the decimal separator for the locale
    const decimalSeparator = Intl.NumberFormat(locale)
      .format(1.1)
      .replace(/\d/g, '');

    // Clean the input: remove all characters except digits, decimal separator, and minus
    const normalizedInput = input
      .replace(new RegExp(`[^\\d\\${decimalSeparator}\\-]`, 'g'), '')
      // Replace localized decimal separator with dot for parsing
      .replace(decimalSeparator, '.');

    // Handle partial inputs (e.g., "1." or "-")
    if (normalizedInput === '.' || normalizedInput === '-' || normalizedInput.endsWith('.')) {
      return 0;
    }

    const parsed = parseFloat(normalizedInput);
    if (isNaN(parsed)) {
      return 0;
    }
    return parsed;
  } catch (error) {
    console.error('Error parsing number:', error);
    return 0;
  }
}

/**
 * @deprecated Use toISODateString() from dateUtils.ts instead. This will be removed when all components are migrated.
 * Parses a localized date string back to ISO format (YYYY-MM-DD)
 * 
 * @param input - The date string to parse
 * @returns The ISO date string (YYYY-MM-DD)
 * 
 * @example
 * // Returns "2024-02-23"
 * parseDate("02/23/2024")
 */
export function parseDate(input: string): string {
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Gets the decimal separator for a given locale
 * 
 * @param locale - The locale to use (e.g., 'en-US', 'de-DE')
 * @returns The decimal separator for the given locale
 * 
 * @example
 * // Returns "."
 * getDecimalSeparator('en-US')
 * 
 * @example
 * // Returns ","
 * getDecimalSeparator('de-DE')
 */
export function getDecimalSeparator(locale: string): string {
  return Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\d/g, '');
}

/**
 * Gets the thousands separator for a given locale
 * 
 * @param locale - The locale to use (e.g., 'en-US', 'de-DE')
 * @returns The thousands separator for the given locale
 * 
 * @example
 * // Returns ","
 * getThousandsSeparator('en-US')
 * 
 * @example
 * // Returns "."
 * getThousandsSeparator('de-DE')
 */
export function getThousandsSeparator(locale: string): string {
  return Intl.NumberFormat(locale)
    .format(1000)
    .replace(/\d/g, '');
} 