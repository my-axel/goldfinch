/**
 * Frontend enum definitions
 */

/**
 * UI Locale options for the application interface
 */
export enum UILocale {
  EN_US = "en-US",
  EN_GB = "en-GB",
  DE_DE = "de-DE"
}

/**
 * Number Locale options for number and date formatting
 */
export enum NumberLocale {
  EN_US = "en-US",
  EN_GB = "en-GB",
  DE_DE = "de-DE"
}

/**
 * Currency options for monetary values
 */
export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP"
}

/**
 * Human-readable labels for UI Locale options
 */
export const UI_LOCALE_LABELS: Record<UILocale, string> = {
  [UILocale.EN_US]: "English (US)",
  [UILocale.EN_GB]: "English (UK)",
  [UILocale.DE_DE]: "Deutsch"
};

/**
 * Human-readable labels for Number Locale options
 */
export const NUMBER_LOCALE_LABELS: Record<NumberLocale, string> = {
  [NumberLocale.EN_US]: "123,456.78 | 02/23/2024",
  [NumberLocale.EN_GB]: "123,456.78 | 23/02/2024",
  [NumberLocale.DE_DE]: "123.456,78 | 23.02.2024"
};

/**
 * Human-readable labels for Currency options
 */
export const CURRENCY_LABELS: Record<Currency, string> = {
  [Currency.USD]: "US Dollar (USD)",
  [Currency.EUR]: "Euro (EUR)",
  [Currency.GBP]: "British Pound (GBP)"
}; 