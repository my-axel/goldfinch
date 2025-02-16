import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog"
import { PensionType, Pension } from "@/frontend/types/pension"
import { ETFPensionForm } from "./form/ETFPensionForm"
import { InsurancePensionForm } from "./form/InsurancePensionForm"
import { CompanyPensionForm } from "./form/CompanyPensionForm"
import { useForm } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"
import { usePension } from "@/frontend/context/PensionContext"
import { Button } from "@/frontend/components/ui/button"
import { Form } from "@/frontend/components/ui/form"
import { useEffect } from "react"

interface EditPensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pension: Pension
}

/**
 * Dialog component for editing existing pension plans.
 * Shows only the type-specific form fields as base fields are immutable after creation.
 */
export function EditPensionDialog({ open, onOpenChange, pension }: EditPensionDialogProps) {
  const { updateEtfPension, updateInsurancePension, updateCompanyPension } = usePension()

  const form = useForm<FormData>({
    defaultValues: {
      type: pension.type,
      name: pension.name,
      member_id: pension.member_id.toString(),
      initial_capital: pension.initial_capital,
      start_date: new Date(pension.start_date),
      ...(pension.type === PensionType.ETF_PLAN && {
        etf_id: pension.etf_id,
        is_existing_investment: pension.is_existing_investment,
        existing_units: pension.existing_units || 0,
        reference_date: pension.reference_date ? new Date(pension.reference_date) : new Date(),
        contribution_plan: pension.contribution_plan?.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        })) || []
      }),
      ...(pension.type === PensionType.INSURANCE && {
        provider: pension.provider,
        contract_number: pension.contract_number,
        guaranteed_interest: pension.guaranteed_interest,
        expected_return: pension.expected_return
      }),
      ...(pension.type === PensionType.COMPANY && {
        employer: pension.employer,
        vesting_period: pension.vesting_period,
        matching_percentage: pension.matching_percentage || 0,
        max_employer_contribution: pension.max_employer_contribution || 0
      })
    } as FormData
  })

  // Reset form when pension changes
  useEffect(() => {
    form.reset({
      type: pension.type,
      name: pension.name,
      member_id: pension.member_id.toString(),
      initial_capital: pension.initial_capital,
      start_date: new Date(pension.start_date),
      ...(pension.type === PensionType.ETF_PLAN && {
        etf_id: pension.etf_id,
        is_existing_investment: pension.is_existing_investment,
        existing_units: pension.existing_units,
        reference_date: pension.reference_date,
        contribution_plan: pension.contribution_plan?.map((step: { amount: number; frequency: ContributionFrequency; start_date: string; end_date?: string | null }) => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        })) || []
      }),
      ...(pension.type === PensionType.INSURANCE && {
        provider: pension.provider,
        contract_number: pension.contract_number,
        guaranteed_interest: pension.guaranteed_interest,
        expected_return: pension.expected_return
      }),
      ...(pension.type === PensionType.COMPANY && {
        employer: pension.employer,
        vesting_period: pension.vesting_period,
        matching_percentage: pension.matching_percentage,
        max_employer_contribution: pension.max_employer_contribution
      })
    })
  }, [pension, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const handleSubmit = async (data: FormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        console.error('Invalid member ID')
        return
      }

      const baseData = {
        name: data.name,
        member_id: memberId,
        initial_capital: Number(data.initial_capital),
        start_date: data.start_date
      }

      switch (data.type) {
        case PensionType.ETF_PLAN:
          await updateEtfPension(pension.id, {
            type: PensionType.ETF_PLAN,
            name: data.name,
            member_id: memberId,
            initial_capital: Number(data.initial_capital),
            start_date: data.start_date,
            etf_id: data.etf_id,
            is_existing_investment: data.is_existing_investment,
            existing_units: data.existing_units,
            reference_date: data.reference_date,
            contribution_plan: data.contribution_plan
          })
          break
        case PensionType.INSURANCE:
          await updateInsurancePension(pension.id, {
            ...baseData,
            type: PensionType.INSURANCE,
            provider: data.provider,
            contract_number: data.contract_number,
            guaranteed_interest: data.guaranteed_interest,
            expected_return: data.expected_return
          })
          break
        case PensionType.COMPANY:
          await updateCompanyPension(pension.id, {
            ...baseData,
            type: PensionType.COMPANY,
            employer: data.employer,
            vesting_period: data.vesting_period,
            matching_percentage: data.matching_percentage,
            max_employer_contribution: data.max_employer_contribution
          })
          break
      }
      handleClose()
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to update pension:', error)
    }
  }

  const renderTypeSpecificForm = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionForm form={form} isEditing={true} />
      case PensionType.INSURANCE:
        return <InsurancePensionForm form={form} />
      case PensionType.COMPANY:
        return <CompanyPensionForm form={form} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Edit {pension.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {renderTypeSpecificForm()}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 