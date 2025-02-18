"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditCompanyPensionForm } from "@/frontend/components/pension/form/EditCompanyPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { useEffect } from "react"

interface EditCompanyPensionPageProps {
  params: {
    id: string
  }
}

export default function EditCompanyPensionPage({ params }: EditCompanyPensionPageProps) {
  const router = useRouter()
  const { selectedPension, fetchPension, updateCompanyPension } = usePension()
  const pensionId = parseInt(params.id)

  const form = useForm<CompanyPensionFormData>({
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: "",
      employer: "",
      start_date: new Date(),
      vesting_period: 0,
      matching_percentage: 0,
      max_employer_contribution: 0,
      contribution_plan_steps: []
    }
  })

  useEffect(() => {
    fetchPension(pensionId)
  }, [fetchPension, pensionId])

  useEffect(() => {
    if (selectedPension && selectedPension.type === PensionType.COMPANY) {
      form.reset({
        type: PensionType.COMPANY,
        name: selectedPension.name,
        member_id: selectedPension.member_id.toString(),
        employer: selectedPension.employer,
        start_date: new Date(selectedPension.start_date),
        vesting_period: selectedPension.vesting_period,
        initial_capital: selectedPension.initial_capital,
        matching_percentage: selectedPension.matching_percentage || 0,
        max_employer_contribution: selectedPension.max_employer_contribution || 0,
        contribution_plan_steps: selectedPension.contribution_plan_steps.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        }))
      })
    }
  }, [selectedPension, form])

  const handleSubmit = async (data: CompanyPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await updateCompanyPension(pensionId, {
        type: PensionType.COMPANY,
        name: data.name,
        member_id: memberId,
        employer: data.employer,
        start_date: data.start_date,
        vesting_period: data.vesting_period,
        matching_percentage: data.matching_percentage,
        max_employer_contribution: data.max_employer_contribution,
        initial_capital: data.initial_capital,
        contribution_plan_steps: data.contribution_plan_steps
      })

      toast.success("Success", { description: "Company pension updated successfully" })
      router.push("/pension")
      router.refresh()
    } catch (error) {
      console.error('Failed to update pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Company Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Update your company pension plan details and contribution schedule.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <EditCompanyPensionForm form={form} />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 