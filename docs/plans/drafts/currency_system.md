# Currency System Frontend Integration

**Duration**: 1-2 weeks
**Status**: 📝 Not Started

## Core Concept
The currency system will handle all monetary values through user settings, without requiring explicit currency selection in forms:

1. **Storage**: All monetary values stored in EUR in the database
2. **Input**: Values entered in user's preferred currency (from settings)
3. **Display**: Values shown in user's preferred currency
4. **Conversion Flow**:
   ```
   Input → Backend:
   1. User enters value in their preferred currency
   2. Backend converts to EUR using current rate
   3. Stores EUR value in database

   Backend → Display:
   1. Backend sends EUR values
   2. Frontend converts to user's preferred currency
   3. Displays formatted value to user
   ```

## Implementation Schedule

### 1. Frontend Components (Week 1)
- [ ] Create currency conversion hooks
  - `useCurrencyConversion`: Handle conversion between EUR and user currency
  - `useCurrencyInput`: Handle form inputs in user currency
  - `useCurrencyDisplay`: Format and display values in user currency
- [ ] Implement currency formatting utilities
- [ ] Add currency selection persistence in user settings
- [ ] Create reusable currency display components

### 2. Application Integration (Week 1-2)
- [ ] Update pension value displays
  - Automatic conversion from stored EUR to display currency
  - Proper formatting based on locale
- [ ] Modify contribution forms
  - Accept input in user's currency
  - Convert to EUR before sending to backend
- [ ] Adapt projection displays
  - Show all projections in user's currency
  - Handle currency conversion for future values
- [ ] Update dashboard calculations
  - Convert all values to user's currency before aggregation
  - Ensure consistent currency display

### 3. Testing & Validation (Week 2)
- [ ] Add component unit tests
- [ ] Implement integration tests
- [ ] Test currency switching
- [ ] Verify formatting across locales

## Dependencies
- Currency System Backend (✅ Complete)
- Settings Module (⚠️ Partial)

## Technical Considerations
- Real-time exchange rate updates
- Performance optimization for currency conversions
- Proper number formatting per locale
- Handling of historical exchange rates
- Edge cases with missing rates
- Caching of conversion rates
- Handling of rounding differences
- Audit trail for conversions

## Integration Points
- ETF Pension value display
- Company Pension contributions
- Insurance Pension premiums
- Dashboard total calculations
- Projection calculations
- Settings currency selection

## API Integration
```typescript
// Currency conversion hook
function useCurrencyConversion() {
  const { settings } = useSettings();
  
  const toEUR = useCallback((amount: number) => {
    // Convert from user currency to EUR
    return convertToEUR(amount, settings.currency);
  }, [settings.currency]);
  
  const fromEUR = useCallback((amount: number) => {
    // Convert from EUR to user currency
    return convertFromEUR(amount, settings.currency);
  }, [settings.currency]);
  
  return { toEUR, fromEUR };
}

// Form input handling
function useCurrencyInput() {
  const { toEUR } = useCurrencyConversion();
  
  const handleSubmit = async (values: FormValues) => {
    const eurValues = {
      ...values,
      amount: toEUR(values.amount)
    };
    await submitToBackend(eurValues);
  };
  
  return { handleSubmit };
}

// Display formatting
function useCurrencyDisplay(eurAmount: number) {
  const { settings } = useSettings();
  const { fromEUR } = useCurrencyConversion();
  
  const formattedValue = formatCurrency(fromEUR(eurAmount), {
    locale: settings.number_locale,
    currency: settings.currency
  });
  
  return formattedValue;
}
```

## Testing Requirements
See [Testing Strategy](../../tech/testing/README.md) for detailed testing plan.

## Migration Strategy
1. Update database to store all values in EUR
2. Add conversion layer in API endpoints
3. Update frontend components to use currency hooks
4. Migrate existing data to EUR
5. Update forms to use user's currency

## Error Handling
- Handle missing exchange rates
- Manage conversion errors
- Provide fallback display options
- Log conversion issues
- Show appropriate error messages

## Performance Optimization
- Cache exchange rates
- Batch conversions where possible
- Optimize number of API calls
- Handle rate updates efficiently

## Integration Points
- ETF Pension value display
- Company Pension contributions
- Insurance Pension premiums
- Dashboard total calculations
- Projection calculations
- Settings currency selection

## Testing Requirements
See [Testing Strategy](../../tech/testing/README.md) for detailed testing plan. 