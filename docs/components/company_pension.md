# Company Pension Components

## Overview

The Company Pension components provide a comprehensive set of UI elements for managing company-sponsored pension plans. These components allow users to create, view, edit, and delete company pensions, as well as track contributions and view retirement projections.

## Core Components

### CompanyPensionForm

A form component for creating and editing company pension plans.

```tsx
import { CompanyPensionForm } from "@/components/pension/company/CompanyPensionForm";

<CompanyPensionForm
  initialData={existingPension}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  members={householdMembers}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| initialData | `Partial<CompanyPension>` | Initial data for the form (optional) |
| onSubmit | `(data: Omit<CompanyPension, 'id' | 'current_value'>) => void` | Function called when the form is submitted |
| isSubmitting | `boolean` | Whether the form is currently submitting |
| members | `Member[]` | List of household members |

### ContributionHistoryCard

A card component that displays the contribution history for a company pension and allows adding new contributions.

```tsx
import { ContributionHistoryCard } from "@/components/pension/company/components/ContributionHistoryCard";

<ContributionHistoryCard pension={companyPension} />
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| pension | `CompanyPension` | The company pension to display contribution history for |

### ProjectionsCard

A card component that displays retirement projections for a company pension.

```tsx
import { ProjectionsCard } from "@/components/pension/company/components/ProjectionsCard";

<ProjectionsCard pension={companyPension} />
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| pension | `CompanyPension` | The company pension to display projections for |

### YearlyInvestmentModal

A modal component for adding contribution history entries to a company pension.

```tsx
import { YearlyInvestmentModal } from "@/components/pension/company/components/YearlyInvestmentModal";

<YearlyInvestmentModal
  open={isOpen}
  onOpenChange={setIsOpen}
  pensionId={pension.id}
  onSuccess={handleSuccess}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| open | `boolean` | Whether the modal is open |
| onOpenChange | `(open: boolean) => void` | Function called when the open state changes |
| pensionId | `string` | ID of the pension to add contribution to |
| onSuccess | `() => void` | Function called when contribution is successfully added (optional) |

## Pages

### Company Pension List Page

Displays a list of all company pensions with filtering and sorting options.

**Route**: `/pension/company`

**Key Features**:
- List of company pensions with key information
- Filtering by member
- Sorting by name, value, and date
- Create new pension button
- View pension details

### New Company Pension Page

Provides a form for creating a new company pension.

**Route**: `/pension/company/new`

**Key Features**:
- Form for entering pension details
- Member selection
- Contribution plan setup
- Projection configuration
- Form validation

### Company Pension Detail Page

Displays detailed information about a specific company pension, including contribution history and projections.

**Route**: `/pension/company/[id]`

**Key Features**:
- Pension overview with key metrics
- Contribution history with add contribution button
- Retirement projections
- Edit and delete options

### Edit Company Pension Page

Provides a form for editing an existing company pension.

**Route**: `/pension/company/[id]/edit`

**Key Features**:
- Pre-filled form with existing pension data
- Update contribution plan
- Modify projections
- Form validation

## Context API

The Company Pension components use the PensionContext for data management:

```tsx
import { usePension } from "@/context/PensionContext";

const { 
  createCompanyPension, 
  updateCompanyPension,
  deleteCompanyPension,
  getCompanyPension,
  getAllCompanyPensions,
  createContributionHistory
} = usePension();
```

### Key Methods

| Method | Description |
|--------|-------------|
| createCompanyPension | Creates a new company pension |
| updateCompanyPension | Updates an existing company pension |
| deleteCompanyPension | Deletes a company pension |
| getCompanyPension | Gets a specific company pension by ID |
| getAllCompanyPensions | Gets all company pensions |
| createContributionHistory | Adds a contribution history entry to a pension |

## Data Models

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

## Usage Examples

### Creating a New Company Pension

```tsx
import { useRouter } from "next/navigation";
import { usePension } from "@/context/PensionContext";
import { useHousehold } from "@/context/HouseholdContext";
import { CompanyPensionForm } from "@/components/pension/company/CompanyPensionForm";
import { toast } from "sonner";

export default function NewCompanyPensionPage() {
  const router = useRouter();
  const { createCompanyPension } = usePension();
  const { members } = useHousehold();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await createCompanyPension(data);
      toast.success("Company pension created successfully");
      router.push("/pension/company");
    } catch (error) {
      toast.error("Failed to create company pension");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyPensionForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      members={members}
    />
  );
}
```

### Displaying Pension Details

```tsx
import { useParams } from "next/navigation";
import { usePension } from "@/context/PensionContext";
import { ContributionHistoryCard } from "@/components/pension/company/components/ContributionHistoryCard";
import { ProjectionsCard } from "@/components/pension/company/components/ProjectionsCard";

export default function CompanyPensionDetailPage() {
  const params = useParams();
  const { getCompanyPension } = usePension();
  const [pension, setPension] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPension = async () => {
      try {
        const data = await getCompanyPension(params.id);
        setPension(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPension();
  }, [params.id, getCompanyPension]);

  if (isLoading) return <div>Loading...</div>;
  if (!pension) return <div>Pension not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{pension.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContributionHistoryCard pension={pension} />
        <ProjectionsCard pension={pension} />
      </div>
    </div>
  );
}
```

## Best Practices

1. **Form Validation**
   - Use Zod schemas for type-safe validation
   - Provide clear error messages
   - Validate dates and numeric inputs

2. **Error Handling**
   - Use try/catch blocks for API calls
   - Display user-friendly error messages with toast notifications
   - Log detailed errors to the console

3. **Loading States**
   - Show loading indicators during data fetching
   - Disable form submission buttons while submitting
   - Provide fallback UI for loading states

4. **Responsive Design**
   - Use grid layouts that adapt to different screen sizes
   - Ensure forms are usable on mobile devices
   - Test on various viewport sizes

5. **Performance**
   - Memoize expensive calculations
   - Use pagination for large lists
   - Implement proper state management 