# Form Best Practices

> <details>
> <summary><strong>🤖 AI Assistant Guide</strong></summary>
>
> ## Purpose
> This guide consolidates all form-related best practices for the Goldfinch application into a single reference. It combines principles from multiple documents into a cohesive approach for implementing forms across the application.
>
> ## When to Use
> - When implementing new forms
> - When refactoring existing forms
> - When reviewing form implementations
> - When considering data fetching strategies for forms
>
> ## Key Areas
> 1. **Architecture**: Parent/child component split with proper data flow
> 2. **Data Fetching**: React Query approach for data retrieval
> 3. **Form Reset**: Standardized approach to form initialization (edit forms)
> 4. **Layout**: Consistent form layout with explanations
> 5. **Validation**: Proper error handling and field validation
> 6. **Specialized Components**: Reusable input and formatting components
>
> ## Implementation Process
> 1. Set up React Query hooks and API services
> 2. Create page component with ErrorBoundary and LoadingState
> 3. Implement form components with proper separation of concerns
> 4. Use useFormReset for edit form initialization (not for add forms)
> 5. Follow the standard form layout structure
> 6. Use specialized input components for specific data types 
> 7. Implement proper validation and error handling
>
> ## Decision Points
> - Whether form needs UI-only state in Context
> - What validation strategy to use (schema validation preferred)
> - Whether form should implement optimistic updates
>
> ## Common Pitfalls
> 1. Mixing data fetching and UI state
> 2. Non-standardized form layouts
> 3. Inconsistent error handling
> 4. Improper type conversion between API and form
> 5. Missing loading states
> 6. Recreating existing specialized input components
> </details>

## Overview

This document consolidates best practices for implementing forms in the Goldfinch application, covering architecture, data fetching with React Query, form state management, layout patterns, and validation strategies.

## 1. Architecture Pattern

### Parent/Child Component Split

**Always** separate forms into two components:

1. **Parent Page Component**:
   - Handles data fetching (using React Query)
   - Manages form state and submission
   - Implements error boundaries and loading states
   - Handles navigation and success/failure states

2. **Child Form Component**:
   - Focuses solely on rendering form fields
   - Receives form instance via props
   - Does not manage global state or fetch data
   - Can be composed of smaller form section components

```tsx
// Parent Component (Page)
export default function EditPensionPage() {
  const { id } = useParams();
  const { data, isLoading } = usePensionData(id, PensionType.STATE);
  const form = useForm<StatePensionFormType>({ defaultValues: {} });
  
  // Form reset logic using useFormReset for edit forms
  useFormReset({
    data,
    form,
    apiToForm: statePensionToForm, 
    defaultValues: defaultStatePensionValues
  });
  
  return (
    <ErrorBoundary>
      {isLoading ? (
        <LoadingState />
      ) : (
        <StatePensionForm form={form} />
      )}
    </ErrorBoundary>
  );
}

// Child Component (Form)
export function StatePensionForm({ form }: { form: UseFormReturn<StatePensionFormType> }) {
  return (
    <FormLayout>
      <FormSection 
        title="Basic Information" 
        explanation={<BasicInfoExplanation />}
      >
        {/* Form fields */}
      </FormSection>
    </FormLayout>
  );
}
```

## 2. Data Fetching with React Query

### API Service Functions

Create pure API service functions first:

```tsx
// services/statePensionService.ts
export const statePensionService = {
  get: async (id: number) => {
    const response = await fetch(`/api/v1/pensions/state/${id}`);
    if (!response.ok) throw new Error('Failed to fetch pension');
    return response.json();
  },
  
  create: async (data: StatePensionCreate) => {
    const response = await fetch('/api/v1/pensions/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create pension');
    return response.json();
  },
  
  // Additional methods...
};
```

### Query Hooks

Then implement React Query hooks for data fetching:

```tsx
// hooks/useStatePension.ts
export function useStatePension(id: number) {
  return useQuery({
    queryKey: ['pension', 'state', id],
    queryFn: () => statePensionService.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useCreateStatePension() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: statePensionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pensions', 'state'] });
      // Handle success
    }
  });
}
```

### UI State Separation

Keep UI-specific state in Context:

```tsx
// context/StatePensionUIContext.tsx
export function StatePensionUIProvider({ children }) {
  const [selectedPensionId, setSelectedPensionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  return (
    <StatePensionUIContext.Provider value={{
      selectedPensionId,
      setSelectedPensionId,
      activeTab,
      setActiveTab
    }}>
      {children}
    </StatePensionUIContext.Provider>
  );
}
```

## 3. Form Reset and Data Transformation

### UseFormReset Hook (for Edit Forms Only)

For consistent form initialization in edit forms, use the `useFormReset` hook. This hook is specifically designed for editing existing data, not for creating new items:

```tsx
// Only use in edit forms, NOT in add/create forms
useFormReset({
  data: pension,                // API data
  form,                         // React Hook Form instance
  apiToForm: statePensionToForm, // Transform function
  defaultValues: defaultStatePensionValues,
  dependencies: [settings.number_locale]
});
```

### Add/Create Forms Initialization

For add/create forms, simply initialize the form with default values:

```tsx
// In add/create forms, just use defaultValues
const form = useForm<StatePensionFormType>({
  defaultValues: defaultStatePensionValues,
  resolver: zodResolver(statePensionSchema)
});
```

### Transform Functions

Create specialized transform functions for converting between API and form data formats:

```tsx
// transformers/statePensionTransformers.ts
export const statePensionToForm = (
  pension: StatePension,
  locale: string
): StatePensionFormData => {
  return {
    name: pension.name || '',
    member_id: pension.member_id,
    start_date: stringToDate(pension.start_date),
    status: pension.status || 'ACTIVE',
    notes: pension.notes || '',
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      statement_date: stringToDate(statement.statement_date),
      current_monthly_amount: statement.current_monthly_amount || undefined,
      projected_monthly_amount: statement.projected_monthly_amount || undefined,
      note: statement.note || ''
    }))
  };
};

// For form submission, convert form data back to API format
export const formToStatePension = (
  formData: StatePensionFormData,
  locale: string
): StatePensionCreate => {
  return {
    name: formData.name,
    member_id: formData.member_id,
    start_date: dateToString(formData.start_date),
    status: formData.status,
    notes: formData.notes || null,
    statements: formData.statements.map(statement => ({
      id: statement.id,
      statement_date: dateToString(statement.statement_date),
      current_monthly_amount: statement.current_monthly_amount,
      projected_monthly_amount: statement.projected_monthly_amount,
      note: statement.note || null
    }))
  };
};
```

## 4. Form Layout Pattern

### Standard Layout Structure

**Always** use the standard form layout components for consistency across all pension forms:

```tsx
<FormLayout>
  <FormSection
    title="Basic Information"
    description="Enter the basic details of your pension"
    explanation={<BasicInfoExplanation />}
    headerActions={
      <Badge variant={pension.status === 'ACTIVE' ? 'default' : 'secondary'}>
        {pension.status}
      </Badge>
    }
  >
    {/* Form fields */}
  </FormSection>
  
  <FormSection
    title="Statements"
    explanation={<StatementsExplanation />}
  >
    {/* Statement fields */}
  </FormSection>
</FormLayout>
```

### Explanation Components

Always create dedicated explanation components for each section to provide context to users:

```tsx
// components/pension/state/explanations/BasicInfoExplanation.tsx
export function BasicInfoExplanation() {
  return (
    <>
      <p>Enter the basic information about your state pension.</p>
      <ExplanationAlert className="mt-4">
        The start date is when you began accumulating your state pension.
      </ExplanationAlert>
    </>
  );
}
```

## 5. Validation and Error Handling

### Schema Validation

Use Zod for form validation:

```tsx
// schemas/statePensionSchema.ts
export const statePensionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  member_id: z.number().int().positive(),
  start_date: z.date(),
  status: z.enum(['ACTIVE', 'PAUSED']),
  notes: z.string().optional(),
  statements: z.array(z.object({
    statement_date: z.date(),
    current_monthly_amount: z.number().optional(),
    projected_monthly_amount: z.number().optional(),
    note: z.string().optional()
  }))
});
```

### Form Errors

Use ErrorBoundary and proper error handling:

```tsx
export function handleApiErrors(error: unknown) {
  if (error instanceof ApiValidationError) {
    // Map API validation errors to form errors
    return { 
      field1: error.fieldErrors.field1?.join(', '),
      field2: error.fieldErrors.field2?.join(', '),
    };
  }
  
  // General error handling
  toast.error("Failed to save: " + getErrorMessage(error));
  return null;
}
```

## 6. Common Patterns

### Loading States

Always use LoadingState for async operations:

```tsx
{isLoading ? (
  <LoadingState message="Loading pension data..." />
) : (
  <PensionForm form={form} onSubmit={handleSubmit} />
)}
```

### Monetary Value Formatting

Format monetary values using the user's locale and currency settings:

```tsx
function FormattedAmount({ value }: { value: number | undefined }) {
  const { settings } = useSettings();
  const [formatted, setFormatted] = useState('');
  
  useEffect(() => {
    if (value !== undefined) {
      setFormatted(formatCurrency(value, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted);
    } else {
      setFormatted('—');
    }
  }, [value, settings]);
  
  return <span>{formatted}</span>;
}
```

### Nested Form Arrays

For nested form arrays, use `useFieldArray`:

```tsx
function StatementFormSection({ form }: { form: UseFormReturn<StatePensionFormType> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "statements"
  });
  
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <StatementFields 
          key={field.id} 
          form={form} 
          index={index} 
          onRemove={() => remove(index)} 
        />
      ))}
      
      <Button 
        type="button" 
        onClick={() => append({ statement_date: new Date(), current_monthly_amount: undefined })}
      >
        Add Statement
      </Button>
    </div>
  );
}
```

## 7. Form Field Components and Controls

### Specialized Input Components

**Always use the existing specialized input components** instead of creating new ones or implementing manual solutions:

```tsx
// Import specialized components
import { 
  NumberInput, 
  PercentInput, 
  CurrencyInput 
} from '@/frontend/components/shared/inputs';
import { DateInput } from '@/frontend/components/ui/date-input';
import { DateEndPicker } from '@/frontend/components/ui/date-end-picker';
import { EnumSelect } from '@/frontend/components/ui/enum-select';
import { RateInput } from '@/frontend/components/ui/rate-input';
```

#### Available Input Components

| Component | Purpose | Example Usage |
|-----------|---------|---------------|
| `NumberInput` | For generic number input with locale formatting | `<NumberInput control={form.control} name="count" />` |
| `PercentInput` | For percentage values with proper formatting | `<PercentInput control={form.control} name="growth_rate" />` |
| `RateInput` | For rate values (e.g., interest rates) | `<RateInput control={form.control} name="inflation_rate" />` |
| `DateInput` | For date selection with calendar | `<DateInput control={form.control} name="start_date" />` |
| `DateEndPicker` | For end date selection with validation | `<DateEndPicker control={form.control} name="end_date" startDateName="start_date" />` |
| `CurrencyInput` | For monetary values with currency formatting | `<CurrencyInput control={form.control} name="amount" />` |
| `EnumSelect` | Type-safe select for enum values | `<EnumSelect<FrequencyType> control={form.control} name="frequency" />` |

### Formatted Display Components

For read-only display of values, use the specialized formatting components:

```tsx
// Import formatted display components
import {
  FormattedCurrency,
  FormattedDate,
  FormattedEnum,
  FormattedFrequency,
  FormattedNumber,
  FormattedPercent
} from '@/frontend/components/shared/formatting';
```

#### Available Display Components

| Component | Purpose | Example Usage |
|-----------|---------|---------------|
| `FormattedCurrency` | Display monetary values | `<FormattedCurrency value={pension.amount} />` |
| `FormattedDate` | Display dates in user's format | `<FormattedDate date={pension.start_date} />` |
| `FormattedEnum` | Display enum values with proper labels | `<FormattedEnum value={pension.status} enumType="PensionStatus" />` |
| `FormattedFrequency` | Display frequency values | `<FormattedFrequency value={pension.frequency} />` |
| `FormattedNumber` | Display numeric values | `<FormattedNumber value={pension.count} />` |
| `FormattedPercent` | Display percentage values | `<FormattedPercent value={pension.growth_rate} />` |

### Form Control Patterns

When implementing form controls, follow these guidelines:

#### Proper Field Wrapping

Always use the proper field wrapping structure:

```tsx
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Amount</FormLabel>
      <FormControl>
        <CurrencyInput {...field} />
      </FormControl>
      <FormDescription>
        Enter the contribution amount
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Controlled vs Uncontrolled

- Use controlled components through React Hook Form's `control` prop
- Avoid implementing your own state for form inputs
- Let React Hook Form handle the form state

```tsx
// Good: Let React Hook Form handle the state
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Amount</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Avoid: Managing your own state
const [amount, setAmount] = useState("");
// ...
<Input 
  value={amount} 
  onChange={(e) => setAmount(e.target.value)} 
/>
```

#### Field-Level Validation

Use the validation provided by the schema and React Hook Form:

```tsx
// In your schema
const schema = z.object({
  amount: z.number().min(0, "Amount must be positive"),
});

// Let React Hook Form handle the validation
const form = useForm({
  resolver: zodResolver(schema),
});
```

#### Custom Validation Logic

For complex validation that depends on multiple fields:

```tsx
const schema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => {
  if (!data.startDate || !data.endDate) return true;
  return data.endDate > data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});
```

### Accessibility Considerations

Ensure all form controls are accessible:

- Always use `<FormLabel>` for labeling form controls
- Include `aria-describedby` when providing additional descriptions
- Ensure error messages are announced to screen readers
- Maintain proper keyboard navigation 
- Use proper HTML5 input types where appropriate

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input 
          type="email" 
          placeholder="your@email.com" 
          aria-describedby="email-description"
          {...field} 
        />
      </FormControl>
      <FormDescription id="email-description">
        We'll never share your email
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## 8. Implementation Checklist

When implementing a new form, follow these steps:

1. ✅ Create API service functions
2. ✅ Implement React Query hooks
3. ✅ Create data transformation functions (apiToForm and formToApi)
4. ✅ Set up parent page component with error boundary
5. ✅ Implement form reset logic (useFormReset for edit forms only)
6. ✅ Create child form component with proper structure
7. ✅ Implement form sections with FormLayout and FormSection components
8. ✅ Use specialized input components for specific data types
9. ✅ Add proper validation schema
10. ✅ Implement form submission and error handling
11. ✅ Add loading states and success/failure feedback

## 9. Migration Path

When migrating existing forms to the new pattern:

1. ✅ Extract API calls to service functions
2. ✅ Create React Query hooks for data fetching
3. ✅ Separate UI state into a dedicated Context
4. ✅ Refactor form reset logic to useFormReset (for edit forms)
5. ✅ Update layout to use FormLayout and FormSection
6. ✅ Replace generic inputs with specialized input components
7. ✅ Implement proper loading and error states 