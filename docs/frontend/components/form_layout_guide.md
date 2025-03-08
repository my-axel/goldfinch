# Form Layout Standardization Guide

This guide explains how to implement the standardized form layout pattern across all pension forms in the Goldfinch application.

## Overview

The standardized form layout uses a flexible two-column grid (8:4 split) with consistent spacing and structure. Each form section has a corresponding explanation component that provides context and guidance to users.

## Components

### FormLayout

The `FormLayout` component creates a 12-column grid with consistent spacing:

```tsx
import { FormLayout } from '@/frontend/components/shared/FormLayout';

function MyForm() {
  return (
    <FormLayout>
      {/* Form sections go here */}
    </FormLayout>
  );
}
```

### FormSection

The `FormSection` component creates a section within the form layout with an 8:4 column split:

```tsx
import { FormSection } from '@/frontend/components/shared/FormSection';
import { MyExplanation } from './explanations/MyExplanation';

function MyFormSection() {
  return (
    <FormSection
      title="Section Title"
      description="Optional section description"
      explanation={<MyExplanation />}
      headerActions={<MyHeaderActions />} // optional
    >
      {/* Form fields go here */}
    </FormSection>
  );
}
```

#### Header Actions

The `headerActions` prop allows you to add actions (such as buttons, badges, or other UI elements) to the section header, displayed on the same line as the title:

```tsx
<FormSection
  title="Section Title"
  description="Section description"
  explanation={<MyExplanation />}
  headerActions={
    <div className="flex items-center gap-2">
      <Badge>Status</Badge>
      <Button size="sm" variant="outline">Action</Button>
    </div>
  }
>
  {/* Form fields */}
</FormSection>
```

This is useful for adding contextual actions that are specific to a section, such as:
- Status indicators
- Toggle buttons
- Action buttons
- Filter controls

For reusable header actions, consider creating dedicated components to maintain consistency across forms.

## Explanation Components

Each form section should have a corresponding explanation component that provides context and guidance to users. These components should be placed in the following directory structure:

```
src/frontend/components/pension/[type]/explanations/[SectionName]Explanation.tsx
```

For example:
- `src/frontend/components/pension/etf/explanations/BasicInformationExplanation.tsx`
- `src/frontend/components/pension/company/explanations/ContributionPlanExplanation.tsx`

### Explanation Component Template

```tsx
import React from 'react';
import { 
  ExplanationAlert, 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

export function SectionNameExplanation() {
  return (
    <>
      <p>
        Main explanation text that describes the purpose of this section.
      </p>
      
      <ExplanationAlert className="mt-4">
        Important information or tips about this section.
      </ExplanationAlert>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Key Point:</strong> Description of a key point
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Another Point:</strong> Description of another point
        </ExplanationListItem>
      </ExplanationList>
    </>
  );
}
```

## Complete Form Example

Here's a complete example of how to structure a form using the standardized layout pattern:

```tsx
import { FormLayout } from '@/frontend/components/shared/FormLayout';
import { FormSection } from '@/frontend/components/shared/FormSection';
import { BasicInformationFields } from './BasicInformationFields';
import { ContributionPlanFields } from './ContributionPlanFields';
import { BasicInformationExplanation } from './explanations/BasicInformationExplanation';
import { ContributionPlanExplanation } from './explanations/ContributionPlanExplanation';

export function PensionForm({ form }) {
  return (
    <FormLayout>
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your pension plan"
        explanation={<BasicInformationExplanation />}
        headerActions={
          <Button size="sm" variant="outline">View History</Button>
        }
      >
        <BasicInformationFields form={form} />
      </FormSection>
      
      <FormSection
        title="Contribution Plan"
        description="Set up your contribution schedule"
        explanation={<ContributionPlanExplanation />}
      >
        <ContributionPlanFields form={form} />
      </FormSection>
    </FormLayout>
  );
}
```

## Error Handling and Loading States

All pension form pages should use the `ErrorBoundary` component to handle errors consistently:

```tsx
import { ErrorBoundary } from '@/frontend/components/shared/ErrorBoundary';

export default function PensionFormPage() {
  return (
    <ErrorBoundary>
      <PensionForm />
    </ErrorBoundary>
  );
}
```

Edit forms should use the `LoadingState` component to display a loading indicator while data is being fetched:

```tsx
import { LoadingState } from '@/frontend/components/shared/LoadingState';

function EditPensionForm() {
  const { data, isLoading, error } = usePensionData(id);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return (
    <FormLayout>
      {/* Form sections */}
    </FormLayout>
  );
}
```

## Data Loading Pattern

All pension forms should use the `usePensionData` hook for data fetching and the `useFormReset` hook for form initialization:

```tsx
import { usePensionData } from '@/frontend/lib/hooks/usePensionData';
import { useFormReset } from '@/frontend/lib/hooks/useFormReset';
import { etfPensionToForm } from '@/frontend/lib/transformers/etfPensionTransformers';

function EditPensionForm() {
  const { data, isLoading, error } = usePensionData(id, PensionType.ETF_PLAN);
  const form = useForm({ defaultValues });
  
  useFormReset({
    data,
    form,
    apiToForm: etfPensionToForm,
    defaultValues
  });
  
  // Rest of the component
}
``` 