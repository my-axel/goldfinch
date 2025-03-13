# 01: Pension Forms Layout Standardization

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This document is part 1 of 4 in the pension forms standardization series. It focuses specifically on implementing a consistent layout pattern across all pension forms.
>
> ## Implementation Order
> 1. **Layout Standardization** (this document)
> 2. Formatting Standardization
> 3. Form Reset Implementation
> 4. Per-Pension Type Implementation
>
> ## Dependencies
> - No external dependencies
>
> ## Expected Outcome
> All pension forms will follow the flexible two-column grid layout with consistent spacing and structure.
>
> ## Status Tracking
> - Use checkboxes to track progress
> - Mark subtasks as they are completed
>
> ## Status Indicators
> - [ ] Not started
> - [x] Completed
> - [~] Partially completed
>
> ## AI Implementation Notes
> - Create only the components specified in this document
> - Use the exact file paths provided
> - Follow the implementation details exactly as shown
> - Do not modify any existing components unless explicitly instructed
> </details>

## 📋 Overview & Goals

This plan addresses the layout inconsistencies across pension forms (ETF, Company, Insurance) by implementing a standardized flexible two-column grid pattern. The Insurance Pension forms are closest to the target layout and should serve as the reference implementation.

### Key Goals
1. Implement a consistent flexible two-column grid (8:4 split) across all forms
2. Ensure each form section has a corresponding explanation
3. Create reusable layout components to simplify implementation
4. Maintain consistent spacing and responsive behavior

### Reference Documents
- [Form Layout Template](docs/frontend/components/form_layout_template.md)

## 📊 Implementation Tasks

### 1. Create Reusable Layout Components

- [x] **Create Base Components**
  - [x] Create `FormLayout` component in `src/frontend/components/shared/FormLayout.tsx`
  - [x] Create `FormSection` component in `src/frontend/components/shared/FormSection.tsx`
  - [x] Add comprehensive documentation and TypeScript types

- [x] **Implement Core Functionality**
  - [x] Implement flexible grid layout with 8:4 column split
  - [x] Add support for section titles and descriptions
  - [x] Ensure proper spacing between sections (gap-6)
  - [x] Implement responsive behavior for mobile devices

- [x] **Create Example Implementation**
  - [x] Add usage examples in component documentation
  - [x] Create a simple demo form using the new components

### 2. Audit Current Form Layouts

- [x] **Document Current Structure**
  - [x] Analyze ETF Pension forms (number of sections, layout pattern)
  - [x] Analyze Company Pension forms (number of sections, layout pattern)
  - [x] Analyze Insurance Pension forms (number of sections, layout pattern)
  - [x] Identify forms that deviate from the target pattern

- [x] **Identify Common Patterns**
  - [x] Document common section types across forms
  - [x] Identify inconsistencies in spacing and alignment
  - [x] Note any form-specific layout requirements

### 3. Implement Layout in Reference Form

- [x] **Update Insurance Pension Add Form**
  - [x] Refactor to use new `FormLayout` and `FormSection` components
  - [x] Ensure all sections have corresponding explanations
  - [x] Verify responsive behavior
  - [x] Document as reference implementation

- [x] **Update Insurance Pension Edit Form**
  - [x] Refactor to use new `FormLayout` and `FormSection` components
  - [x] Ensure all sections have corresponding explanations
  - [x] Verify responsive behavior
  - [x] Maintain consistency with Add Form

## 🔍 Implementation Details

### FormLayout Component

File: `src/frontend/components/shared/FormLayout.tsx`

```tsx
import React from 'react';

interface FormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function FormLayout({ children, className = '' }: FormLayoutProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 ${className}`}>
      {children}
    </div>
  );
}
```

### FormSection Component

File: `src/frontend/components/shared/FormSection.tsx`

```tsx
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/frontend/components/ui/card';
import { Explanation, ExplanationHeader, ExplanationContent } from '@/frontend/components/ui/explanation';

interface FormSectionProps {
  title: string;
  description?: string;
  explanation?: React.ReactNode; // Optional explanation
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ 
  title, 
  description, 
  explanation, 
  children,
  className = ''
}: FormSectionProps) {
  return (
    <>
      {/* Always 8/12 columns for the form section */}
      <div className={`md:col-span-8 ${className}`}>
        <Card>
          <CardHeader className="pb-7">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
      
      {/* Explanation column - always 4/12 columns, but content is optional */}
      <div className="md:col-span-4">
        {explanation && (
          <Explanation>
            <ExplanationHeader>{title}</ExplanationHeader>
            <ExplanationContent>
              {explanation}
            </ExplanationContent>
          </Explanation>
        )}
      </div>
    </>
  );
}
```

### Usage Example

```tsx
import { FormLayout, FormSection } from '@/frontend/components/shared';
import { BasicInformationFields } from './BasicInformationFields';
import { ContributionFields } from './ContributionFields';
import { BasicInformationExplanation } from './explanations/BasicInformationExplanation';
import { ContributionExplanation } from './explanations/ContributionExplanation';

export function PensionForm({ form }) {
  return (
    <FormLayout>
      {/* Section with explanation */}
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your pension plan"
        explanation={<BasicInformationExplanation />}
      >
        <BasicInformationFields form={form} />
      </FormSection>
      
      {/* Section without explanation */}
      <FormSection
        title="Contribution Details"
        description="Set up your contribution plan"
      >
        <ContributionFields form={form} />
      </FormSection>
    </FormLayout>
  );
}
```

### Explanation Component Template

For each form section, create a corresponding explanation component with this structure:

File: `src/frontend/components/pension/[type]/explanations/[SectionName]Explanation.tsx`

```tsx
import React from 'react';
import { 
  ExplanationContent, 
  ExplanationAlert, 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

export function SectionNameExplanation() {
  return (
    <ExplanationContent>
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
    </ExplanationContent>
  );
}
```