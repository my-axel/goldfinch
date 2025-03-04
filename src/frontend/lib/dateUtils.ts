/**
 * Core date utility functions for consistent date handling across the application.
 * These utilities handle common date operations while ensuring type safety and proper error handling.
 */

/**
 * Safely converts any date-like value to a JavaScript Date object
 * Returns null if the input cannot be converted to a valid date
 * 
 * @param value - Any value that might represent a date (Date object, string, etc.)
 * @returns Date object if valid, null otherwise
 */
export function toDateObject(value: unknown): Date | null {
  if (!value) return null;
  
  // Already a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  // Only handle string inputs - numbers and other types should return null
  if (typeof value !== 'string') {
    return null;
  }
  
  // String type
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely converts a date to ISO format string (YYYY-MM-DD)
 * Returns empty string if the input is invalid
 * 
 * @param value - Any value that might represent a date
 * @returns ISO date string (YYYY-MM-DD) or empty string if invalid
 */
export function toISODateString(value: unknown): string {
  const date = toDateObject(value);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Safely formats a date for display according to locale
 * Returns empty string if the input is invalid
 * 
 * @param value - Any value that might represent a date
 * @param locale - Locale string (e.g., 'en-US', 'de-DE')
 * @returns Formatted date string according to locale or empty string if invalid
 */
export function formatDisplayDate(value: unknown, locale: string = 'en-US'): string {
  const date = toDateObject(value);
  if (!date) return '';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Safely parses a date from a form input
 * Returns a proper Date object with time set to midnight UTC
 * 
 * @param value - Date string from form input (YYYY-MM-DD)
 * @returns Date object set to midnight UTC
 * @throws Error if the input string is invalid
 */
export function parseFormDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string provided to parseFormDate');
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Type guard to check if a value is a valid Date object
 * 
 * @param value - Any value to check
 * @returns boolean indicating if the value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
} 