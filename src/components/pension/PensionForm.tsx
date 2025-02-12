"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form"
import { PensionType } from "@/types/pension"
import { useForm } from "react-hook-form"
import { BasePensionFields } from "./form/BasePensionFields"
import { ETFPensionForm } from "./form/ETFPensionForm"
import { InsurancePensionForm } from "./form/InsurancePensionForm"
import { CompanyPensionForm } from "./form/CompanyPensionForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormData } from "@/types/pension-form"

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
 * TODO: Add form validation with proper error messages
 * TODO: Add field descriptions/tooltips
 * TODO: Add support for contribution plans
 * TODO: Add support for ETF allocations
 */
export function PensionForm({ type, onTypeChange, onSubmit, defaultValues, isEditing }: PensionFormProps) {
  const initialValues = {
    type,
    name: "",
    member_id: "",
    initial_capital: 0,
    start_date: new Date(),
    contribution_plan: [],
    ...(type === PensionType.ETF_PLAN && { automatic_rebalancing: false }),
    ...(type === PensionType.INSURANCE && { provider: "", contract_number: "" }),
    ...(type === PensionType.COMPANY && { employer: "", vesting_period: 0 }),
    ...defaultValues
  } as FormData

  const form = useForm<FormData>({ 
    defaultValues: initialValues,
    resetOptions: {
      keepDirtyValues: isEditing
    }
  })

  /**
   * Renders the type-specific form fields based on the selected pension type
   */
  const renderTypeSpecificForm = () => {
    switch (type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionForm form={form} />
      case PensionType.INSURANCE:
        return <InsurancePensionForm form={form} />
      case PensionType.COMPANY:
        return <CompanyPensionForm form={form} />
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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