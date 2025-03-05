/**
 * Type definitions for formatting options
 */
export interface FormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  decimals?: number;
  compact?: boolean;
  currencyPosition?: 'prefix' | 'suffix';
}

export interface SafeNumber {
  formatted: string;    // Display value (e.g., "1.234,56 €")
  value: number;        // Raw value (e.g., 1234.56)
}

/**
 * @deprecated Use types from dateUtils.ts instead. This will be removed when all components are migrated.
 */
export interface SafeDate {
  formatted: string;    // Display value (e.g., "23.02.2024")
  value: string;        // Backend value (e.g., "2024-02-23")
}

/**
 * Gets the currency symbol for a given locale and currency
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
 */
export function formatPercent(value: number, options?: Omit<FormatOptions, 'style'>): SafeNumber {
  return formatNumber(value, { ...options, style: 'percent' });
}

/**
 * @deprecated Use formatDisplayDate() from dateUtils.ts instead. This will be removed when all components are migrated.
 * Formats a date according to the given locale
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
 */
export function getDecimalSeparator(locale: string): string {
  return Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\d/g, '');
}

/**
 * Gets the thousands separator for a given locale
 */
export function getThousandsSeparator(locale: string): string {
  return Intl.NumberFormat(locale)
    .format(1000)
    .replace(/\d/g, '');
} 