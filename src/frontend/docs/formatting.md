# Frontend Formatting Utilities Documentation

## Overview

The frontend formatting utilities provide a comprehensive set of functions for handling number and date formatting with locale support. These utilities ensure consistent formatting across the application while respecting user preferences.

## Features

- Locale-aware number formatting
- Currency formatting with proper symbols
- Percentage formatting
- Date formatting
- Input parsing for numbers and dates
- Locale-specific separator utilities
- Type-safe interfaces
- Comprehensive error handling

## Core Types

### FormatOptions
```typescript
interface FormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  decimals?: number;
  compact?: boolean;
}
```

### SafeNumber
```typescript
interface SafeNumber {
  formatted: string;    // Display value (e.g., "1.234,56 €")
  value: number;        // Raw value (e.g., 1234.56)
}
```

### SafeDate
```typescript
interface SafeDate {
  formatted: string;    // Display value (e.g., "23.02.2024")
  value: string;        // Backend value (e.g., "2024-02-23")
}
```

## Formatting Functions

### Number Formatting

#### formatNumber
```typescript
function formatNumber(value: number, options?: FormatOptions): SafeNumber
```

Formats a number according to the given locale and options.

**Example**
```typescript
const result = formatNumber(1234.56, {
  locale: "de-DE",
  decimals: 2
});
// result = { formatted: "1.234,56", value: 1234.56 }
```

#### formatCurrency
```typescript
function formatCurrency(
  value: number, 
  options?: Omit<FormatOptions, 'style'>
): SafeNumber
```

Formats a currency value according to the given locale.

**Example**
```typescript
const result = formatCurrency(1234.56, {
  locale: "de-DE",
  currency: "EUR"
});
// result = { formatted: "1.234,56 €", value: 1234.56 }
```

#### formatPercent
```typescript
function formatPercent(
  value: number, 
  options?: Omit<FormatOptions, 'style'>
): SafeNumber
```

Formats a percentage value according to the given locale.

**Example**
```typescript
const result = formatPercent(0.1234, {
  locale: "de-DE",
  decimals: 2
});
// result = { formatted: "12,34%", value: 0.1234 }
```

### Date Formatting

#### formatDate
```typescript
function formatDate(
  date: string | Date, 
  options?: Pick<FormatOptions, 'locale'>
): SafeDate
```

Formats a date according to the given locale.

**Example**
```typescript
const result = formatDate("2024-02-23", { locale: "de-DE" });
// result = { formatted: "23.02.2024", value: "2024-02-23" }
```

## Parsing Functions

### Number Parsing

#### parseNumber
```typescript
function parseNumber(input: string, locale: string): number
```

Parses a localized number string back to a number.

**Example**
```typescript
const value = parseNumber("1.234,56", "de-DE");
// value = 1234.56
```

**Features**
- Handles empty input (returns 0)
- Supports partial inputs (e.g., "1." or "-")
- Removes group separators
- Converts locale decimal separator to dot

### Date Parsing

#### parseDate
```typescript
function parseDate(input: string): string
```

Parses a date string to ISO format (YYYY-MM-DD).

**Example**
```typescript
const value = parseDate("2024-02-23");
// value = "2024-02-23"
```

## Utility Functions

### getCurrencySymbol
```typescript
function getCurrencySymbol(locale: string, currency: string): string
```

Gets the currency symbol for a given locale and currency.

**Example**
```typescript
const symbol = getCurrencySymbol("de-DE", "EUR");
// symbol = "€"
```

### getDecimalSeparator
```typescript
function getDecimalSeparator(locale: string): string
```

Gets the decimal separator for a given locale.

**Example**
```typescript
const separator = getDecimalSeparator("de-DE");
// separator = ","
```

### getThousandsSeparator
```typescript
function getThousandsSeparator(locale: string): string
```

Gets the thousands separator for a given locale.

**Example**
```typescript
const separator = getThousandsSeparator("de-DE");
// separator = "."
```

## Usage with Forms

### Number Input Example
```typescript
const [amountInput, setAmountInput] = useState("");
const decimalSeparator = getDecimalSeparator(settings.number_locale);

// Validate number format
const isValidNumberFormat = (value: string): boolean => {
  if (!value) return true;
  const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`);
  return regex.test(value);
};

// Handle input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  if (isValidNumberFormat(newValue)) {
    setAmountInput(newValue);
    const parsedValue = parseNumber(newValue, settings.number_locale);
    if (parsedValue >= 0) {
      field.onChange(parsedValue);
    }
  }
};

// Handle input blur
const handleBlur = () => {
  const value = parseNumber(amountInput, settings.number_locale);
  if (value >= 0) {
    setAmountInput(value.toString().replace('.', decimalSeparator));
    field.onChange(value);
  } else {
    setAmountInput("");
    field.onChange(0);
  }
  field.onBlur();
};
```

## Error Handling

All formatting functions include comprehensive error handling:
- Invalid inputs return safe defaults
- Errors are logged to console
- Type safety is maintained
- Fallback formatting is provided

## Best Practices

1. **Type Safety**
   - Use provided interfaces
   - Validate inputs early
   - Handle all error cases

2. **Locale Handling**
   - Always pass user's locale
   - Use locale-specific separators
   - Test with multiple locales

3. **Form Integration**
   - Validate on input
   - Format on blur
   - Provide clear feedback

4. **Performance**
   - Cache separator values
   - Minimize state updates
   - Use memoization where appropriate

## Components

### RateInput
```typescript
interface RateInputProps {
  label: string
  value: number | string
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  error?: string
}
```

A reusable input component for rate values with increment/decrement buttons.

**Features**
- Numeric input with percentage formatting
- Increment/decrement buttons
- Min/max value constraints
- Step size customization
- Error state handling
- Disabled state support

**Example**
```typescript
<RateInput
  label="Inflation Rate"
  value={2.5}
  onChange={(value) => handleRateChange(value)}
  min={0}
  max={10}
  step={0.1}
/>
```

### ProjectionPreview
```typescript
interface ProjectionPreviewProps {
  locale: string
  currency: string
  rates: {
    inflation_rate: number | string
    projection_pessimistic_rate: number | string
    projection_realistic_rate: number | string
    projection_optimistic_rate: number | string
  }
}
```

A component that displays investment projections based on different scenarios.

**Features**
- Displays nominal and inflation-adjusted values
- Supports multiple projection scenarios
- Locale-aware number formatting
- Currency formatting
- Real-time updates

**Example**
```typescript
<ProjectionPreview
  locale="de-DE"
  currency="EUR"
  rates={{
    inflation_rate: 2.0,
    projection_pessimistic_rate: 2.0,
    projection_realistic_rate: 5.0,
    projection_optimistic_rate: 8.0
  }}
/>
```

### Projection Calculations

#### calculateProjection
```typescript
interface ProjectionParams {
  currentValue: number
  monthlyContribution: number
  yearsToRetirement: number
}

function calculateProjection(
  params: ProjectionParams,
  annualRate: number,
  inflationRate: number = 0
): number
```

Calculates future investment value based on given parameters.

**Features**
- Compound interest calculation
- Monthly contribution compounding
- Inflation adjustment
- Handles both nominal and real returns

**Example**
```typescript
const projection = calculateProjection(
  {
    currentValue: 100000,
    monthlyContribution: 1000,
    yearsToRetirement: 30
  },
  5.0,  // 5% annual return
  2.0   // 2% inflation
);
```

**Formula**
1. Monthly rate = Annual rate / 12 / 100
2. Future value of current principal = Principal * (1 + monthly_rate)^months
3. Future value of contributions = Monthly * ((1 + monthly_rate)^months - 1) / monthly_rate
4. Total nominal value = Principal future value + Contributions future value
5. Real value = Nominal value / (1 + monthly_inflation_rate)^months 