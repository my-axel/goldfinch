"use client"

import { Button } from "@/frontend/components/ui/button"
import { Form, FormControl, FormItem, FormLabel } from "@/frontend/components/ui/form"
import { PensionType } from "@/frontend/types/pension"
import { useForm } from "react-hook-form"
import { BasePensionFields } from "./form/BasePensionFields"
import { ETFPensionForm } from "./form/ETFPensionForm"
import { InsurancePensionForm } from "./form/InsurancePensionForm"
import { CompanyPensionForm } from "./form/CompanyPensionForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { FormData } from "@/frontend/types/pension-form"

/**
 * Props for the PensionForm component
 * @property type - The type of pension (ETF, Insurance, Company)
 * @property onTypeChange - Callback when pension type changes
 * @property onSubmit - Callback when form is submitted
 * @property defaultValues - Optional initial values for the form
 * @property isEditing - Whether the form is in edit mode
 */
interface PensionFormProps {
  type: PensionType
  onTypeChange: (type: PensionType) => void
  onSubmit: (data: FormData) => void
  defaultValues?: Partial<FormData>
  isEditing?: boolean
}

/**
 * Form component for creating and editing pension plans.
 * Renders different form fields based on the selected pension type.
 * 
 * Features:
 * - Type selection (disabled in edit mode)
 * - Base fields (name, member, initial capital)
 * - Type-specific fields:
 *   - ETF: ETF selection and contribution plan
 *   - Insurance: Provider, contract number, start date
 *   - Company: Employer, vesting period, start date
 * 
 * TODO: Add form validation messages
 * TODO: Add loading states during submission
 * TODO: Add progress indicator for multi-step forms
 * TODO: Add preview of pension details
 * TODO: Add form autosave
 * TODO: Add API integration for form submission
 * TODO: Add data validation layer
 */
export function PensionForm({ type, onTypeChange, onSubmit, defaultValues, isEditing }: PensionFormProps) {
  const form = useForm<FormData>({
    defaultValues: {
      type,
      name: "",
      member_id: "",
      initial_capital: 0,
      ...(type === PensionType.ETF_PLAN && { 
        automatic_rebalancing: false,
        contribution_plan: []
      }),
      ...(type === PensionType.INSURANCE && { 
        provider: "", 
        contract_number: "",
        start_date: new Date()
      }),
      ...(type === PensionType.COMPANY && { 
        employer: "", 
        vesting_period: 0,
        start_date: new Date()
      }),
      ...defaultValues
    } as FormData
  })

  /**
   * Handles form submission.
   * Prevents default form behavior and calls onSubmit with form data.
   * TODO: Add form validation before submission
   * TODO: Add error handling
   * TODO: Add loading state during submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = form.getValues()
    onSubmit(data)
  }

  /**
   * Renders the type-specific form fields based on the selected pension type.
   * Returns the appropriate form component based on pension type.
   * TODO: Add error boundary for form components
   * TODO: Add loading states for dynamic imports
   */
  const renderTypeSpecificForm = () => {
    switch (type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionForm form={form} />
      case PensionType.INSURANCE:
        return <InsurancePensionForm form={form} />
      case PensionType.COMPANY:
        return <CompanyPensionForm form={form} />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormItem>
          <FormLabel>Pension Type</FormLabel>
          <Select 
            value={type} 
            onValueChange={onTypeChange}
            disabled={isEditing}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select pension type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={PensionType.ETF_PLAN}>ETF Plan</SelectItem>
              <SelectItem value={PensionType.INSURANCE}>Insurance</SelectItem>
              <SelectItem value={PensionType.COMPANY}>Company</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>

        <BasePensionFields form={form} />
        {renderTypeSpecificForm()}
        
        <Button type="submit">
          {isEditing ? 'Update' : 'Create'} Pension
        </Button>
      </form>
    </Form>
  )
}