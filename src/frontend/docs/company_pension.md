# Company Pension Components Documentation

## Overview

The Company Pension components provide a comprehensive set of UI elements and utilities for managing company-sponsored pension plans. These components ensure consistent data handling, proper validation, and responsive design while respecting user preferences for number formatting and localization.

## Features

- Complete CRUD operations for company pensions
- Contribution management with history tracking
- Value tracking with automatic calculations
- Retirement projections visualization
- Interactive forms with validation
- Responsive layouts for all screen sizes
- Locale-aware number and date formatting
- Type-safe interfaces

## Core Types

### CompanyPension
```typescript
interface CompanyPension {
  id: string;
  type: 'COMPANY';
  name: string;
  member_id: string;
  employer: string;
  start_date: string;
  contribution_amount: number;
  contribution_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  latest_statement_date: string;
  current_value: number;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  contribution_plan_steps: ContributionPlanStep[];
  projections: PensionProjection[];
}
```

### ContributionPlanStep
```typescript
interface ContributionPlanStep {
  id: string;
  start_date: string;
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  is_active: boolean;
}
```

### PensionProjection
```typescript
interface PensionProjection {
  id: string;
  retirement_age: number;
  monthly_payout: number;
  total_value: number;
}
```

### ContributionHistory
```typescript
interface ContributionHistory {
  id: string;
  date: string;
  amount: number;
  is_manual: boolean;
  note?: string;
}
```

## Core Components

### CompanyPensionForm
```typescript
interface CompanyPensionFormProps {
  initialData?: Partial<CompanyPension>;
  onSubmit: (data: Omit<CompanyPension, 'id' | 'current_value'>) => void;
  isSubmitting?: boolean;
  members: Member[];
}
```

A form component for creating and editing company pension plans.

**Example**
```tsx
<CompanyPensionForm
  initialData={existingPension}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  members={householdMembers}
/>
```

### ContributionHistoryCard
```typescript
interface ContributionHistoryCardProps {
  pension: CompanyPension;
}
```

A card component that displays the contribution history for a company pension and allows adding new contributions.

**Example**
```tsx
<ContributionHistoryCard pension={companyPension} />
```

### ProjectionsCard
```typescript
interface ProjectionsCardProps {
  pension: CompanyPension;
}
```

A card component that displays retirement projections for a company pension.

**Example**
```tsx
<ProjectionsCard pension={companyPension} />
```

### YearlyInvestmentModal
```typescript
interface YearlyInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pensionId: string;
  onSuccess?: () => void;
}
```

A modal component for adding contribution history entries to a company pension.

**Example**
```tsx
<YearlyInvestmentModal
  open={isOpen}
  onOpenChange={setIsOpen}
  pensionId={pension.id}
  onSuccess={handleSuccess}
/>
```

## Context API

### PensionContext
The PensionContext provides methods for managing company pensions:

```typescript
interface PensionContextType {
  // Company Pension methods
  createCompanyPension: (data: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<CompanyPension>;
  updateCompanyPension: (id: string, data: Partial<Omit<CompanyPension, 'id' | 'current_value'>>) => Promise<CompanyPension>;
  deleteCompanyPension: (id: string) => Promise<void>;
  getCompanyPension: (id: string) => Promise<CompanyPension>;
  getAllCompanyPensions: () => Promise<CompanyPension[]>;
  createContributionHistory: (
    pensionId: string, 
    data: { 
      amount: number; 
      date: string; 
      is_manual: boolean; 
      note?: string 
    }
  ) => Promise<void>;
  // Other pension methods...
}
```

**Example Usage**
```tsx
const { createCompanyPension, updateCompanyPension } = usePension();

// Create a new company pension
const handleCreate = async (data) => {
  try {
    const newPension = await createCompanyPension(data);
    // Handle success
  } catch (error) {
    // Handle error
  }
};

// Update an existing company pension
const handleUpdate = async (id, data) => {
  try {
    const updatedPension = await updateCompanyPension(id, data);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

## Pages

### Company Pension List Page
Displays a list of all company pensions with filtering and sorting options.

**Route**: `/pension/company`

### New Company Pension Page
Provides a form for creating a new company pension.

**Route**: `/pension/company/new`

### Company Pension Detail Page
Displays detailed information about a specific company pension, including contribution history and projections.

**Route**: `/pension/company/[id]`

### Edit Company Pension Page
Provides a form for editing an existing company pension.

**Route**: `/pension/company/[id]/edit`

## Best Practices

1. **Form Validation**
   - Always validate input data before submission
   - Use Zod schemas for type-safe validation
   - Provide clear error messages for validation failures

2. **Date Handling**
   - Use ISO format (YYYY-MM-DD) for API communication
   - Format dates according to user locale for display
   - Use date picker components for date input

3. **Number Formatting**
   - Use the formatting utilities for consistent number display
   - Format currency values according to user preferences
   - Parse user input correctly based on locale

4. **Error Handling**
   - Implement proper error boundaries
   - Provide user-friendly error messages
   - Log errors for debugging

5. **Performance Considerations**
   - Optimize rendering of large lists
   - Use memoization for expensive calculations
   - Implement pagination for large datasets

## Related Components

- **HouseholdContext**: Provides member data for pension assignment
- **SettingsContext**: Provides locale and currency preferences
- **FormattingUtils**: Provides number and date formatting functions 