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
- Store all monetary values in EUR, convert for display based on user settings

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
GET    /api/v1/pensions/state/{pension_id}/scenarios
GET    /api/v1/pension-summaries/state
```

### UI Components
1. **StatePensionCard**
   - Display current monthly payout
   - Display projected monthly payout
   - Show latest statement date
   - Display status (ACTIVE/PAUSED)
   - Actions: Edit, Delete

2. **StatePensionForm**
   - Create/Edit state pension
   - Statement management
   - Form validation
   - Status management

3. **ProjectionScenarios**
   - Display scenarios based on settings rates
   - Show monthly and annual amounts
   - Group by retirement age (planned/possible)

### Data Types
```typescript
// Align with backend StatePensionListSchema
interface StatePension {
  id: number;
  name: string;
  member_id: number;
  start_date: string;
  status: 'ACTIVE' | 'PAUSED';
  latest_statement_date?: string;
  latest_monthly_amount?: number;
  latest_projected_amount?: number;
  latest_current_value?: number;
}

interface StatePensionStatement {
  id: number;
  pension_id: number;
  statement_date: string;
  current_value?: number;
  current_monthly_amount?: number;
  projected_monthly_amount?: number;
  note?: string;
}

interface StatePensionScenario {
  monthly_amount: number;
  annual_amount: number;
  retirement_age: number;
  years_to_retirement: number;
  growth_rate: number;
}

interface StatePensionProjection {
  planned: {
    pessimistic: StatePensionScenario;
    realistic: StatePensionScenario;
    optimistic: StatePensionScenario;
  };
  possible: {
    pessimistic: StatePensionScenario;
    realistic: StatePensionScenario;
    optimistic: StatePensionScenario;
  };
}
```

## Implementation Steps

### 1. React Query Setup
- [x] Create API service functions
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

- [x] Implement query hooks
```typescript
// src/frontend/hooks/useStatePensions.ts
export function useStatePensions() {
  return useQuery({
    queryKey: ['pensions', 'state'],
    queryFn: statePensionService.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStatePensionScenarios(pensionId: number) {
  return useQuery({
    queryKey: ['pensions', 'state', pensionId, 'scenarios'],
    queryFn: () => statePensionService.getScenarios(pensionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!pensionId
  });
}
```

### 2. UI State Management
- [x] Create UI Context
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
- [x] Create StatePensionCard component
- [x] Implement StatePensionForm
- [x] Add StatePensionStatementForm 
- [x] Implement ScenarioViewer component
- [x] Implement list view integration
- [x] Add status toggle functionality

### 4. Form Validation
- [ ] Implement form validation using existing patterns
- [ ] Add error handling for API calls
- [ ] Add loading states
- [ ] Implement validation for statement fields

### 5. Settings Integration
- [ ] Use SettingsContext to display the applied growth rates alongside projection results
- [ ] Format monetary values using user locale and currency settings
- [ ] Add tooltips explaining which growth rates were used in calculations

### 6. Testing & Documentation
- [ ] Write tests for React Query hooks
- [ ] Document patterns for future migrations
- [ ] Create usage examples

## Dependencies
- React Query setup
- Existing pension components
- Backend API implementation
- Settings enhancement

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
        latest_monthly_amount: pension.latest_monthly_amount 
          ? formatCurrency(pension.latest_monthly_amount, {
              locale: settings.number_locale,
              currency: settings.currency
            }).formatted
          : null,
        latest_projected_amount: pension.latest_projected_amount
          ? formatCurrency(pension.latest_projected_amount, {
              locale: settings.number_locale,
              currency: settings.currency
            }).formatted
          : null
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

### Form Pattern
```typescript
function StatePensionFormPage() {
  // Use a parent page component with data fetching
  const { id } = useParams();
  const { data, isLoading } = useStatePension(id);
  
  return (
    <ErrorBoundary>
      {isLoading ? (
        <LoadingState />
      ) : (
        <StatePensionForm defaultValues={data} />
      )}
    </ErrorBoundary>
  );
}

function StatePensionForm({ defaultValues }) {
  // Form component using useForm with proper defaults
  const form = useForm({
    defaultValues,
    resolver: zodResolver(statePensionSchema)
  });
  
  // Rest of form implementation
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
  
  it('fetches scenarios for a pension', async () => {
    const { result } = renderHook(() => useStatePensionScenarios(1));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.planned).toBeDefined();
    expect(result.current.data.possible).toBeDefined();
  });
  
  // Add more test cases...
});
``` 

## Core Components

1. **Type Definitions**
   - [x] Define `StatePension` interface
   - [x] Define `StatePensionStatement` interface
   - [x] Define `StatePensionScenario` interface
   - [x] Define `StatePensionList` interface for list views
   - [x] Update `PensionList` union type

2. **React Query Setup**
   - [x] Create API service functions
     - [x] List state pensions
     - [x] Create/update/delete state pensions
     - [x] List/create/update/delete statements
     - [x] Fetch scenarios
   - [x] Implement query hooks
     - [x] `useStatePensions` for pension list
     - [x] `useStatePension` for pension detail
     - [x] `useStatePensionStatements` for statements
     - [x] `useStatePensionScenarios` for scenarios
     - [x] Mutation hooks for CRUD operations

3. **UI State Management**
   - [x] Create StatePensionUIContext for managing:
     - Selected pension ID
     - Active tab
     - Form open/closed state

4. **Form Components**
   - [x] `StatePensionForm` (renamed to `BasicInformationCard`) - Basic information form for state pensions
   - [x] `StatePensionStatementForm` (renamed to `StatementsCard`) - Form for statement management
   - [ ] `ScenarioViewer` - Component to display projected scenarios
   - [ ] List view integration

5. **Explanation Components**
   - [x] `BasicInformationExplanation` - explains basic info fields
   - [x] `StatementsExplanation` - explains statement fields and purpose
   - [x] `ScenariosExplanation` - explains scenario projections and assumptions

6. **List View Integration**
   - [x] Integrate state pensions into the main pension list view
   - [x] Create state pension summary cards
   - [x] Implement state pension filtering

7. **Create/Edit Pages**
   - [x] Create page for new state pensions
   - [x] Edit page for existing state pensions

## Testing
   - [ ] Unit tests for the components
   - [ ] Integration tests for the forms
   - [ ] End-to-end tests for the pages 