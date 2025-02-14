"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog"
import { PensionType } from "@/frontend/types/pension"
import { useState } from "react"
import { BasePensionFields } from "./form/BasePensionFields"
import { ETFPensionForm } from "./form/ETFPensionForm"
import { InsurancePensionForm } from "./form/InsurancePensionForm"
import { CompanyPensionForm } from "./form/CompanyPensionForm"
import { useForm } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"
import { usePension } from "@/frontend/context/PensionContext"
import { Button } from "@/frontend/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Form } from "@/frontend/components/ui/form"

interface AddPensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog component for adding new pension plans in a two-step process.
 * Step 1: Select type and fill base fields
 * Step 2: Fill type-specific fields
 */
export function AddPensionDialog({ open, onOpenChange }: AddPensionDialogProps) {
  const [step, setStep] = useState(1)
  const [pensionType, setPensionType] = useState<PensionType>(PensionType.ETF_PLAN)
  const { createEtfPension, createInsurancePension, createCompanyPension } = usePension()

  const form = useForm<FormData>({
    defaultValues: {
      type: pensionType,
      name: "",
      member_id: "",
      initial_capital: 0,
      start_date: new Date(),
      ...(pensionType === PensionType.ETF_PLAN && {
        etf_id: "",
        contribution_plan: []
      }),
      ...(pensionType === PensionType.INSURANCE && {
        provider: "",
        contract_number: "",
        guaranteed_interest: 0,
        expected_return: 0
      }),
      ...(pensionType === PensionType.COMPANY && {
        employer: "",
        vesting_period: 0,
        matching_percentage: undefined,
        max_employer_contribution: undefined
      })
    }
  })

  const handleClose = () => {
    setStep(1)
    setPensionType(PensionType.ETF_PLAN)
    form.reset()
    onOpenChange(false)
  }

  const handleNextStep = async () => {
    const isValid = await form.trigger(['name', 'member_id', 'initial_capital', 'start_date'])
    if (!isValid) return
    setStep(2)
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
          await createEtfPension({
            ...baseData,
            type: PensionType.ETF_PLAN,
            etf_id: data.etf_id
          })
          break
        case PensionType.INSURANCE:
          await createInsurancePension({
            ...baseData,
            type: PensionType.INSURANCE,
            provider: data.provider,
            contract_number: data.contract_number,
            guaranteed_interest: data.guaranteed_interest,
            expected_return: data.expected_return
          })
          break
        case PensionType.COMPANY:
          await createCompanyPension({
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
      console.error('Failed to create pension:', error)
    }
  }

  const renderTypeSpecificForm = () => {
    switch (pensionType) {
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Add New Pension Plan - Step {step}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Pension Type</label>
                    <Select
                      value={pensionType}
                      onValueChange={(value) => setPensionType(value as PensionType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pension type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PensionType.ETF_PLAN}>ETF Plan</SelectItem>
                        <SelectItem value={PensionType.INSURANCE}>Insurance</SelectItem>
                        <SelectItem value={PensionType.COMPANY}>Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <BasePensionFields form={form} />
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <>
                {renderTypeSpecificForm()}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit">
                    Create Pension
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 