# Savings Pension - Frontend Implementation Plan

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document outlines the test-driven implementation plan for the Savings pension type in the frontend. It provides detailed guidance for implementing types, API client, React Query hooks, form components, and page components following test-driven development principles.
>
> ## Document Structure
>
> ### 1. Overview
> - Core features and requirements
> - Implementation approach
> - Key components
>
> ### 2. Test-Driven Implementation Process
> - Types and API client tests
> - React Query hooks tests
> - Form and card component tests
> - Page component and integration tests
>
> ### 3. Implementation Based on Tests
> - Implementation steps organized by phase
> - Component structure and hierarchy
>
> ## Decision Making Guide
>
> ### When Implementing Types
> 1. Extend existing pension type enums
> 2. Create interfaces with appropriate properties
> 3. Ensure type safety for API responses
>
> ### When Implementing Hooks
> 1. Follow React Query patterns from other pension types
> 2. Create separate hooks for different operations
> 3. Implement proper error handling
>
> ### When Implementing Components
> 1. Create reusable form sections
> 2. Implement clear explanation components
> 3. Follow existing UI patterns
> 4. Use consistent form validation rules
>
> ## Status Indicators
> - ✅ Complete
> - 🟡 In Progress
> - 📝 Not Started
>
> ## Rules & Best Practices
> 1. Write tests before implementation
> 2. Reuse patterns from existing pension types
> 3. Implement clear user guidance in forms
> 4. Ensure responsive design
> 5. Apply consistent styling
> </details>

**Status**: 📝 Planning Phase  
**Duration**: 2-3 weeks  
**Approach**: Test-Driven Development  

## 1. Overview

This document outlines the test-driven implementation plan for the Savings pension type in the frontend. The Savings pension type will be implemented following React Query patterns and form best practices.

Key features:
- Track savings account balances via statements
- Configure interest rates for different scenarios
- Manage contribution plans (regular deposits)
- Visualize projections with compound interest

## 2. Test-Driven Implementation Process

### Phase 1: Types and API Client (Week 1, Days 1-2)

#### 2.1.1 Types Definition Tests

```typescript
// src/frontend/__tests__/savings-pension-types.test.ts
import { PensionType, ContributionFrequency, CompoundingFrequency } from '@/frontend/types/pension';

describe('Savings Pension Types', () => {
  it('should include SAVINGS in PensionType enum', () => {
    expect(PensionType).toHaveProperty('SAVINGS');
  });
  
  it('should define SavingsPension interface correctly', () => {
    // We can only test this indirectly since TypeScript interfaces are not available at runtime
    // This test is more for documentation purposes
    const mockSavingsPension = {
      id: 1,
      type: PensionType.SAVINGS,
      name: 'Test Savings',
      member_id: 2,
      start_date: '2020-01-01',
      status: 'ACTIVE',
      notes: 'Test notes',
      pessimistic_rate: 1.0,
      realistic_rate: 2.0,
      optimistic_rate: 3.0,
      compounding_frequency: CompoundingFrequency.ANNUALLY,
      statements: [],
      contribution_plan_steps: []
    };
    
    expect(mockSavingsPension).toHaveProperty('pessimistic_rate');
    expect(mockSavingsPension).toHaveProperty('realistic_rate');
    expect(mockSavingsPension).toHaveProperty('optimistic_rate');
    expect(mockSavingsPension).toHaveProperty('compounding_frequency');
  });
});
```

#### 2.1.2 API Service Tests

```typescript
// src/frontend/__tests__/savings-pension-service.test.ts
import { savingsPensionService } from '@/frontend/services/savingsPensionService';
import { PensionType, ContributionFrequency, CompoundingFrequency } from '@/frontend/types/pension';

// Mock fetch
global.fetch = jest.fn();

describe('Savings Pension Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch all savings pensions', async () => {
    const mockResponse = [
      {
        id: 1,
        type: PensionType.SAVINGS,
        name: 'Test Savings',
        member_id: 2
      }
    ];
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await savingsPensionService.getAll();
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/pension/savings');
  });
  
  it('should fetch savings pension by ID', async () => {
    const mockResponse = {
      id: 1,
      type: PensionType.SAVINGS,
      name: 'Test Savings',
      member_id: 2
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await savingsPensionService.get(1);
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/pension/savings/1');
  });
  
  it('should create a savings pension', async () => {
    const mockRequest = {
      name: 'New Savings',
      member_id: 2,
      start_date: '2020-01-01',
      pessimistic_rate: 1.0,
      realistic_rate: 2.0,
      optimistic_rate: 3.0,
      compounding_frequency: CompoundingFrequency.ANNUALLY
    };
    
    const mockResponse = {
      id: 1,
      ...mockRequest
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await savingsPensionService.create(mockRequest);
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/pension/savings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockRequest)
      })
    );
  });
});
```

### Phase 2: React Query Hooks (Week 1, Days 3-4)

```typescript
// src/frontend/__tests__/use-savings-pension.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavingsPensions, useSavingsPension } from '@/frontend/hooks/useSavingsPensions';
import { savingsPensionService } from '@/frontend/services/savingsPensionService';

// Mock the service
jest.mock('@/frontend/services/savingsPensionService');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Savings Pension Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });
  
  it('useSavingsPensions should fetch all savings pensions', async () => {
    const mockPensions = [{ id: 1, name: 'Test Savings' }];
    (savingsPensionService.getAll as jest.Mock).mockResolvedValueOnce(mockPensions);
    
    const { result } = renderHook(() => useSavingsPensions(), { wrapper });
    
    // Initial state should be loading
    expect(result.current.isLoading).toBeTruthy();
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    
    // Check the resolved data
    expect(result.current.data).toEqual(mockPensions);
    expect(savingsPensionService.getAll).toHaveBeenCalled();
  });
  
  it('useSavingsPension should fetch a single savings pension', async () => {
    const mockPension = { id: 1, name: 'Test Savings' };
    (savingsPensionService.get as jest.Mock).mockResolvedValueOnce(mockPension);
    
    const { result } = renderHook(() => useSavingsPension(1), { wrapper });
    
    // Initial state should be loading
    expect(result.current.isLoading).toBeTruthy();
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    
    // Check the resolved data
    expect(result.current.data).toEqual(mockPension);
    expect(savingsPensionService.get).toHaveBeenCalledWith(1);
  });
});
```

### Phase 3: Form and Card Components (Week 1, Day 5 - Week 2, Day 3)

```typescript
// src/frontend/__tests__/savings-pension-form.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavingsPensionForm } from '@/frontend/components/pension/savings/SavingsPensionForm';

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
    getValues: jest.fn(),
    register: jest.fn(),
    formState: { errors: {} }
  }),
  Controller: ({ render }) => render({ field: { value: '', onChange: jest.fn() } }),
  FormProvider: ({ children }) => <div>{children}</div>
}));

describe('SavingsPensionForm', () => {
  it('renders the form with all required sections', () => {
    render(<SavingsPensionForm form={{}} onSubmit={jest.fn()} members={[]} isSubmitting={false} />);
    
    // Check for section headings
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Interest Rates')).toBeInTheDocument();
    expect(screen.getByText('Initial Balance')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
    
    // Check for key form fields
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Pessimistic Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Realistic Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Optimistic Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Compounding Frequency')).toBeInTheDocument();
  });
});
```

### Phase 4: Page Components and Integration (Week 2, Days 4-5)

```typescript
// src/frontend/__tests__/savings-pension-add.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useHouseholdMembers } from '@/frontend/hooks/useHouseholdMembers';
import { useCreateSavingsPension } from '@/frontend/hooks/useSavingsPensions';
import AddSavingsPensionPage from '@/app/pension/savings/new/page';

// Mock necessary dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/frontend/hooks/useHouseholdMembers', () => ({
  useHouseholdMembers: jest.fn()
}));

jest.mock('@/frontend/hooks/useSavingsPensions', () => ({
  useCreateSavingsPension: jest.fn()
}));

describe('AddSavingsPensionPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  
  const mockMembers = [
    { id: 1, name: 'Test Member' }
  ];
  
  const mockCreateMutation = {
    mutateAsync: jest.fn(),
    isPending: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useHouseholdMembers as jest.Mock).mockReturnValue({ data: mockMembers });
    (useCreateSavingsPension as jest.Mock).mockReturnValue(mockCreateMutation);
  });
  
  it('renders the page with form', () => {
    render(<AddSavingsPensionPage />);
    
    expect(screen.getByText('Create Savings Account')).toBeInTheDocument();
    // Check that form components are rendered
    expect(screen.getByTestId('savings-pension-form')).toBeInTheDocument();
  });
  
  it('handles form submission', async () => {
    mockCreateMutation.mutateAsync.mockResolvedValueOnce({ id: 1 });
    
    render(<AddSavingsPensionPage />);
    
    // Simulate form submission
    fireEvent.submit(screen.getByTestId('savings-pension-form'));
    
    await waitFor(() => {
      expect(mockCreateMutation.mutateAsync).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/pension/savings');
    });
  });
});
```

## 3. Implementation Based on Tests

### Phase 1: Types and API Client (Week 1, Days 1-2)

1. Update PensionType enum to include SAVINGS.
2. Create CompoundingFrequency enum with options like DAILY, MONTHLY, QUARTERLY, ANNUALLY.
3. Create SavingsPension interface.
4. Create SavingsPensionStatement and related interfaces.
5. Implement savingsPensionService API client.

### Phase 2: React Query Hooks (Week 1, Days 3-4)

1. Implement useSavingsPensions and related hooks:
   - useSavingsPension (get single)
   - useCreateSavingsPension
   - useUpdateSavingsPension
   - useDeleteSavingsPension
   - useCreateSavingsPensionStatement
   - useSavingsPensionProjection

2. Implement form validation schemas:
   - savingsPensionSchema
   - savingsPensionStatementSchema

3. Implement data transformation utilities:
   - formToSavingsPension
   - savingsPensionToForm

### Phase 3: Form and Card Components (Week 1, Day 5 - Week 2, Day 3)

1. Create explanation components:
   - BasicInformationExplanation
   - InterestRatesExplanation
   - BalanceExplanation
   - ContributionPlanExplanation

2. Implement form components:
   - SavingsPensionForm (main form component)
   - BasicInformationCard
   - InterestRatesCard
   - StatementsCard
   - ContributionPlanCard
   - ProjectionsCard

3. Implement form field arrays:
   - StatementsFieldArray
   - ContributionPlanFieldArray

### Phase 4: Page Components and Integration (Week 2, Days 4-5)

1. Implement page components:
   - New/Add Savings Pension page
   - Edit Savings Pension page
   - List/Index Savings Pensions page
   - Savings Pension Detail page

2. Update routing and navigation:
   - Add routes for savings pension
   - Update PENSION_ROUTE_MAPPING
   - Implement navigation helpers

3. Integrate with existing components:
   - Update PensionProvider context (if necessary)
   - Update household pages to include savings pensions

## 4. Project Structure

```
src/frontend/
├── types/
│   └── pension.ts (update with SavingsPension type)
├── services/
│   └── savingsPensionService.ts
├── hooks/
│   └── useSavingsPensions.ts
├── lib/
│   └── transformers/
│       └── savingsPensionTransformers.ts
├── components/
│   └── pension/
│       └── savings/
│           ├── BasicInformationCard.tsx
│           ├── InterestRatesCard.tsx
│           ├── StatementsCard.tsx
│           ├── ContributionPlanCard.tsx
│           ├── ProjectionsCard.tsx
│           ├── SavingsPensionForm.tsx
│           └── explanations/
│               ├── BasicInformationExplanation.tsx
│               ├── InterestRatesExplanation.tsx
│               ├── BalanceExplanation.tsx
│               └── ContributionPlanExplanation.tsx
└── app/
    └── pension/
        └── savings/
            ├── page.tsx (list view)
            ├── new/
            │   └── page.tsx (create view)
            └── [id]/
                ├── page.tsx (detail view)
                └── edit/
                    └── page.tsx (edit view)
```

## 5. Testing & Documentation

1. Complete component tests
2. Test integration with other modules
3. Document form components
4. Update user guides
