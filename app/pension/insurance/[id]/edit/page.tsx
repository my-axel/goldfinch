"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditInsurancePensionForm } from "@/frontend/components/pension/form/EditInsurancePensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { useEffect } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"

interface EditInsurancePensionPageProps {
  params: {
    id: string
  }
}

export default function EditInsurancePensionPage({ params }: EditInsurancePensionPageProps) {
  const router = useRouter()
  const { selectedPension, fetchPension, updateInsurancePension } = usePension()
  const pensionId = parseInt(params.id)

  const form = useForm<InsurancePensionFormData>({
    defaultValues: {
      type: PensionType.INSURANCE,
      name: "",
      member_id: "",
      provider: "",
      contract_number: "",
      start_date: new Date(),
      guaranteed_interest: 0,
      expected_return: 0,
      contribution_plan_steps: []
    }
  })

  useEffect(() => {
    fetchPension(pensionId)
  }, [fetchPension, pensionId])

  useEffect(() => {
    if (selectedPension && selectedPension.type === PensionType.INSURANCE) {
      form.reset({
        type: PensionType.INSURANCE,
        name: selectedPension.name,
        member_id: selectedPension.member_id.toString(),
        provider: selectedPension.provider,
        contract_number: selectedPension.contract_number,
        start_date: new Date(selectedPension.start_date),
        guaranteed_interest: selectedPension.guaranteed_interest,
        expected_return: selectedPension.expected_return,
        initial_capital: selectedPension.initial_capital,
        contribution_plan_steps: selectedPension.contribution_plan_steps.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        }))
      })
    }
  }, [selectedPension, form])

  const handleSubmit = async (data: InsurancePensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await updateInsurancePension(pensionId, {
        type: PensionType.INSURANCE,
        name: data.name,
        member_id: memberId,
        provider: data.provider,
        contract_number: data.contract_number,
        start_date: data.start_date,
        guaranteed_interest: data.guaranteed_interest,
        expected_return: data.expected_return,
        contribution_plan_steps: data.contribution_plan_steps
      })

      toast.success("Success", { description: "Insurance pension updated successfully" })
      router.push(getPensionListRoute())
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Insurance Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Update your insurance pension plan details and contribution schedule.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <EditInsurancePensionForm form={form} />
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