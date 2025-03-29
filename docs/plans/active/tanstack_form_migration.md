# Tanstack Form Migration Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document outlines the plan to migrate form implementations to Tanstack Form while maintaining existing functionality and preparing for future enhancements.
>
> ## Key Considerations
> 1. **Context Dependencies**
>    - Settings Context is used app-wide for formatting/localization
>    - Pension Context manages complex business logic
>    - Some contexts will remain, others will be replaced
>
> 2. **Form Types**
>    - Settings Form: Complex validation, app-wide usage
>    - Pension Forms: Complex state, nested data
>    - New Forms (e.g., Savings): Greenfield implementation
>
> 3. **Migration Strategy**
>    - Gradual migration to prevent breaking changes
>    - Hybrid approach for Settings (keep context, add Tanstack Form)
>    - Schema-first approach for new implementations
>
> ## Implementation Rules
> 1. **Form Organization**
>    - Place schemas in `forms/[type]/schema.ts`
>    - Place hooks in `forms/[type]/use[Type]Form.ts`
>    - Keep types in `forms/[type]/types.ts`
>
> 2. **Validation**
>    - Use Zod for schema validation
>    - Define field-level validation rules
>    - Implement cross-field validation in schema
>
> 3. **State Management**
>    - Use Tanstack Form for form state
>    - Keep necessary contexts for app-wide state
>    - Use Tanstack Query for data fetching
>
> 4. **Testing**
>    - Test schemas independently
>    - Test form submission flows
>    - Compare with existing implementation
>
> ## Working with Forms
> 1. **Creating New Forms**
>    - Start with schema definition
>    - Create custom hook with form logic
>    - Implement UI components last
>
> 2. **Migrating Existing Forms**
>    - Analyze current implementation
>    - Create equivalent schema
>    - Keep existing context if needed
>    - Migrate form logic to hook
>
> 3. **Form Components**
>    - Use field-level components
>    - Implement proper error handling
>    - Follow accessibility guidelines
>
> ## Status Tracking
> - Update PROGRESS.md when implementing
> - Mark completed migrations
> - Document any breaking changes
> </details>

## Overview

This document outlines the plan to migrate our forms to Tanstack Form while maintaining compatibility with existing functionality and preparing for future enhancements.

## Current Form Architecture

### Settings Form
- Uses SettingsContext + Tanstack Query
- Form state managed in component
- Validation in component
- Used throughout the app for formatting and localization
- Complex rate validation logic

### Pension Forms
1. **State Pension**
   - Uses PensionContext
   - Complex statement management
   - Rate scenarios
   - Status management (active/paused)

2. **ETF Pension**
   - Uses ETFContext
   - Complex contribution plans
   - Historical data
   - Performance tracking

3. **Company Pension**
   - Uses PensionContext
   - Contribution plans
   - Statement management
   - Employer information

4. **Insurance Pension**
   - Uses PensionContext
   - Complex projections
   - Provider information
   - Cost calculations

## Migration Strategy

### Phase 1: Settings Form Migration

1. **Create Base Form Schema**
```typescript
// src/frontend/forms/settings/schema.ts
import { z } from 'zod'

export const settingsSchema = z.object({
  ui_locale: z.enum(['en-US', 'de-DE']),
  number_locale: z.enum(['en-US', 'de-DE']),
  currency: z.enum(['USD', 'EUR']),
  projection_pessimistic_rate: z.number()
    .min(0)
    .max(15)
    .refine(
      (val, ctx) => val <= ctx.projection_realistic_rate,
      'Pessimistic rate must be lower than realistic rate'
    ),
  // ... other fields with validation
})
```

2. **Create Form Hook**
```typescript
// src/frontend/forms/settings/useSettingsForm.ts
import { createFormFactory } from '@tanstack/form'
import { useSettings, useUpdateSettings } from '@/frontend/hooks/useSettings'

export const useSettingsForm = () => {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()

  return createFormFactory({
    defaultValues: settings,
    onSubmit: async (values) => {
      await updateSettings.mutateAsync(values)
    },
    validatorSchema: settingsSchema
  })
}
```

3. **Keep Context for App-wide Settings**
```typescript
// src/frontend/context/SettingsContext.tsx
export function SettingsProvider({ children }) {
  const { data: settings } = useSettings()
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}
```

### Phase 2: State Pension Form Migration

1. **Create Base Schema**
```typescript
// src/frontend/forms/pension/state/schema.ts
import { z } from 'zod'

export const statePensionSchema = z.object({
  type: z.literal(PensionType.STATE),
  name: z.string().min(1),
  member_id: z.string(),
  start_date: z.date(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED']),
  statements: z.array(z.object({
    statement_date: z.date(),
    current_monthly_amount: z.number().min(0).optional(),
    projected_monthly_amount: z.number().min(0).optional(),
    current_value: z.number().min(0).optional(),
    note: z.string().optional()
  }))
})
```

2. **Create Form Hook**
```typescript
// src/frontend/forms/pension/state/useStatePensionForm.ts
export const useStatePensionForm = (pensionId?: number) => {
  const { data: pension } = usePensionData(pensionId, PensionType.STATE)
  const updatePension = useUpdateStatePension()

  return createFormFactory({
    defaultValues: pension ? statePensionToForm(pension) : defaultValues,
    onSubmit: async (values) => {
      await updatePension.mutateAsync(values)
    },
    validatorSchema: statePensionSchema
  })
}
```

### Phase 3: New Savings Pension Implementation

1. **Schema First Approach**
```typescript
// src/frontend/forms/pension/savings/schema.ts
export const savingsPensionSchema = z.object({
  type: z.literal(PensionType.SAVINGS),
  name: z.string().min(1),
  member_id: z.string(),
  start_date: z.date(),
  provider: z.string().min(1),
  interest_rate: z.number().min(0).max(100),
  contribution_plan: z.array(
    z.object({
      amount: z.number().min(0),
      frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
      start_date: z.date(),
      end_date: z.date().optional()
    })
  )
})
```

2. **Form Implementation**
```typescript
// src/frontend/forms/pension/savings/useSavingsPensionForm.ts
export const useSavingsPensionForm = () => {
  return createFormFactory({
    defaultValues: savingsPensionDefaults,
    onSubmit: async (values) => {
      await createSavingsPension.mutateAsync(values)
    },
    validatorSchema: savingsPensionSchema
  })
}
```

## Implementation Guidelines

### 1. Form Organization
```
src/frontend/
├── forms/
│   ├── settings/
│   │   ├── schema.ts
│   │   ├── useSettingsForm.ts
│   │   └── types.ts
│   └── pension/
│       ├── state/
│       ├── etf/
│       ├── company/
│       ├── insurance/
│       └── savings/
```

### 2. Best Practices
- Use Zod for schema validation
- Keep form logic in custom hooks
- Separate business logic from UI
- Use field-level validation where possible
- Implement proper TypeScript types

### 3. Migration Order
1. Settings Form (test hybrid approach)
2. State Pension Form (test complex validation)
3. New Savings Pension (greenfield implementation)
4. ETF Pension Form
5. Company Pension Form
6. Insurance Pension Form

### 4. Testing Strategy
- Unit tests for schemas
- Integration tests for form submission
- E2E tests for critical flows
- Migration tests comparing old vs new

## Benefits

1. **Type Safety**
   - Full TypeScript support
   - Runtime validation
   - Better IDE support

2. **Performance**
   - Field-level updates
   - Optimized re-renders
   - Better state management

3. **Developer Experience**
   - Consistent API
   - Better error handling
   - Simplified testing

4. **Maintenance**
   - Centralized validation
   - Reusable form logic
   - Easier debugging

## Risks and Mitigation

1. **Breaking Changes**
   - Gradual migration
   - Comprehensive testing
   - Feature flags if needed

2. **Performance Impact**
   - Monitor bundle size
   - Implement code splitting
   - Performance testing

3. **Learning Curve**
   - Documentation
   - Team training
   - Example implementations

## Timeline

1. **Phase 1 (1-2 weeks)**
   - Set up Tanstack Form
   - Migrate Settings Form
   - Create base utilities

2. **Phase 2 (2-3 weeks)**
   - Migrate State Pension Form
   - Create reusable components
   - Establish patterns

3. **Phase 3 (1-2 weeks)**
   - Implement Savings Pension
   - Document best practices
   - Team review

4. **Phase 4 (3-4 weeks)**
   - Migrate remaining forms
   - Comprehensive testing
   - Performance optimization

## Success Criteria

1. All forms migrated to Tanstack Form
2. No regression in functionality
3. Improved type safety
4. Better performance metrics
5. Positive developer feedback
6. Comprehensive test coverage

## Future Considerations

1. Form state persistence
2. Multi-step form wizards
3. Form analytics
4. Advanced validation patterns
5. Custom field components
6. Performance optimizations 