# State Pension Frontend Core Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This plan outlines the frontend implementation for state pensions using a hybrid React Query approach, serving as a template for future pension type migrations.
>
> ## Implementation Process
> 1. Create API services and React Query hooks
> 2. Implement UI components with hybrid state management
> 3. Document patterns for future migrations
>
> ## Critical Guidelines
> 1. Follow React Query hybrid pattern
> 2. Maintain consistency with existing pension UIs
> 3. Document learnings for future migrations
> </details>

## Overview
**Feature**: State Pension Frontend Implementation
**Type**: Frontend
**Duration**: 1 week
**Status**: 📝 Not Started
**Priority**: High
**Related Plan**: [Backend Implementation](backend_implementation.md), [Settings Enhancement](settings_enhancement.md)

## Description
Implement the frontend for state pensions using a hybrid approach with React Query for data fetching and Context for UI state. This implementation will serve as a template for migrating other pension types to React Query in the future.

## Important Rules & Guidelines
- Use React Query for data fetching and mutations
- Keep UI state in Context
- Follow existing pension type patterns for consistency
- Use proper form validation and error handling
- Follow formatting best practices for currency and dates

## Requirements

### API Integration
Based on backend implementation:
```typescript
// API endpoints to implement
GET    /api/v1/pensions/state
POST   /api/v1/pensions/state
GET    /api/v1/pensions/state/{id}
PUT    /api/v1/pensions/state/{id}
DELETE /api/v1/pensions/state/{id}
GET    /api/v1/pensions/state/{pension_id}/statements
POST   /api/v1/pensions/state/{pension_id}/statements
PUT    /api/v1/pensions/state/{pension_id}/statements/{id}
DELETE /api/v1/pensions/state/{pension_id}/statements/{id}
```

### UI Components
1. **StatePensionCard**
   - Display current monthly payout
   - Display projected monthly payout
   - Show latest statement date
   - Actions: Edit, Delete

2. **StatePensionForm**
   - Create/Edit state pension
   - Statement management
   - Form validation

### Data Types
```typescript
// Align with backend StatePensionListSchema
interface StatePension {
  id: number;
  name: string;
  member_id: number;
  start_date: string;
  latest_statement_date?: string;
  latest_monthly_amount?: number;
  latest_projected_amount?: number;
}

interface StatePensionStatement {
  id: number;
  pension_id: number;
  statement_date: string;
  current_value: number;  // Current monthly pension amount
  current_monthly_amount: number;
  projected_monthly_amount: number;
  note?: string;
}
```

## Implementation Steps

### 1. React Query Setup
- [ ] Create API service functions
```typescript
// src/frontend/services/statePensionService.ts
export const statePensionService = {
  list: async () => {
    const response = await fetch('/api/v1/pensions/state');
    if (!response.ok) throw new Error('Failed to fetch state pensions');
    return response.json();
  },
  getScenarios: async (pensionId: number) => {
    const response = await fetch(`/api/v1/pensions/state/${pensionId}/scenarios`);
    if (!response.ok) throw new Error('Failed to fetch pension scenarios');
    return response.json();
  },
  // ... other API methods
};
```

- [ ] Implement query hooks
```typescript
// src/frontend/hooks/useStatePensions.ts
export function useStatePensions() {
  return useQuery({
    queryKey: ['pensions', 'state'],
    queryFn: statePensionService.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 2. UI State Management
- [ ] Create UI Context
```typescript
// src/frontend/context/StatePensionUIContext.tsx
export function StatePensionUIProvider({ children }) {
  const [selectedPensionId, setSelectedPensionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  return (
    <StatePensionUIContext.Provider value={{
      selectedPensionId,
      setSelectedPensionId,
      isFormOpen,
      setIsFormOpen,
    }}>
      {children}
    </StatePensionUIContext.Provider>
  );
}
```

### 3. Component Implementation
- [ ] Create StatePensionCard component
- [ ] Implement StatePensionForm
- [ ] Add StatePensionStatementForm
- [ ] Implement list view integration

### 4. Form Validation
- [ ] Implement form validation using existing patterns
- [ ] Add error handling for API calls
- [ ] Add loading states

### 5. Testing & Documentation
- [ ] Write tests for React Query hooks
- [ ] Document patterns for future migrations
- [ ] Create usage examples

## Dependencies
- React Query setup
- Existing pension components
- Backend API implementation

## Technical Notes

### React Query Pattern
```typescript
// Example component using hybrid approach
function StatePensionList() {
  // Data fetching with React Query
  const { data: pensions, isLoading } = useStatePensions();
  
  // UI state from Context
  const { selectedPensionId, setSelectedPensionId } = useStatePensionUI();
  
  // Formatting with existing patterns
  const { settings } = useSettings();
  const [formattedPensions, setFormattedPensions] = useState([]);
  
  useEffect(() => {
    if (pensions) {
      setFormattedPensions(pensions.map(pension => ({
        ...pension,
        current_value: formatCurrency(pension.current_value, {
          locale: settings.number_locale,
          currency: settings.currency
        }).formatted
      })));
    }
  }, [pensions, settings]);
  
  if (isLoading) return <LoadingState />;
  
  return (
    <div>
      {formattedPensions.map(pension => (
        <StatePensionCard
          key={pension.id}
          pension={pension}
          isSelected={pension.id === selectedPensionId}
          onSelect={() => setSelectedPensionId(pension.id)}
        />
      ))}
    </div>
  );
}
```

### Migration Learnings
Document key learnings about:
- React Query implementation patterns
- Performance improvements
- Challenges faced
- Solutions found

This documentation will help guide future pension type migrations to React Query.

## Testing
```typescript
describe('StatePension React Query Integration', () => {
  it('fetches and displays pensions', async () => {
    const { result } = renderHook(() => useStatePensions());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
  
  // Add more test cases...
});
``` 