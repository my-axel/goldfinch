/**
 * Form Utilities
 * 
 * This file contains centralized utilities for form transformations.
 * It provides consistent data handling across all form implementations.
 * 
 * Key functions:
 * - ensureArray: Ensures a value is an array, returning empty array if null/undefined
 * - withDefault: Returns a default value if the provided value is null/undefined
 * - Re-exports: toDateObject from dateUtils and safeNumberValue from transforms
 */

import { toDateObject } from '@/frontend/lib/dateUtils';
import { safeNumberValue } from '@/frontend/lib/transforms';

/**
 * Ensures a value is an array, returning an empty array if null or undefined
 */
export const ensureArray = <T>(value: T[] | null | undefined): T[] => {
  return value || [];
};

/**
 * Returns a default value if the provided value is null or undefined
 */
export const withDefault = <T>(value: T | null | undefined, defaultValue: T): T => {
  return (value === null || value === undefined) ? defaultValue : value;
};

// Re-export existing utilities for consistency
export { 
  toDateObject,    // for date handling
  safeNumberValue  // for number handling
}; 