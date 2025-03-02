# EnumSelect Refactoring TODO

This document lists all places in the codebase where the `EnumSelect` component should be used instead of standard Select components with enum values to ensure proper handling during form resets.

## ContributionFrequency Enum Selects

### Company Pension Forms
- [x] `src/frontend/components/pension/company/forms/EditCompanyPensionForm.tsx` (line ~442) - Already implemented
- [ ] `src/frontend/components/pension/company/forms/AddCompanyPensionForm.tsx` (line ~425)
- [ ] `src/frontend/components/pension/company/forms/AddCompanyPensionForm.tsx` (line ~539) - Contribution step frequency

### Insurance Pension Forms
- [ ] `src/frontend/components/pension/insurance/forms/AddInsurancePensionForm.tsx` (line ~226)
- [ ] `src/frontend/components/pension/insurance/forms/EditInsurancePensionForm.tsx` (line ~316)

### ETF Pension Forms
- [ ] `src/frontend/components/pension/etf/forms/AddETFPensionForm.tsx` (line ~353)
- [ ] `src/frontend/components/pension/etf/forms/EditETFPensionContributionStepsForm.tsx` (line ~186)

## Other Enum Selects

### Settings Page
- [ ] `app/settings/page.tsx` (line ~266) - Language selection
- [ ] `app/settings/page.tsx` (line ~301) - Number format selection
- [ ] `app/settings/page.tsx` (line ~321) - Currency selection

## Implementation Guide

For each TODO item, replace the standard Select implementation with EnumSelect:

```tsx
// Before
<FormField
  control={form.control}
  name="contribution_frequency"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Contribution Frequency</FormLabel>
      <Select
        value={field.value}
        onValueChange={field.onChange}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value={ContributionFrequency.MONTHLY}>Monthly</SelectItem>
          <SelectItem value={ContributionFrequency.QUARTERLY}>Quarterly</SelectItem>
          <SelectItem value={ContributionFrequency.SEMI_ANNUALLY}>Semi-Annually</SelectItem>
          <SelectItem value={ContributionFrequency.ANNUALLY}>Annually</SelectItem>
          <SelectItem value={ContributionFrequency.ONE_TIME}>One-Time</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

// After
<EnumSelect<ContributionFrequency, FormDataType>
  name="contribution_frequency"
  control={form.control}
  label="Contribution Frequency"
  options={[
    { value: ContributionFrequency.MONTHLY, label: "Monthly" },
    { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
    { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
    { value: ContributionFrequency.ANNUALLY, label: "Annually" },
    { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
  ]}
  defaultValue={ContributionFrequency.MONTHLY}
/>
```

Replace `FormDataType` with the appropriate form data type for each form (e.g., `CompanyPensionFormData`). 