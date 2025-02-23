"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditETFPensionForm } from "@/frontend/components/pension/form/EditETFPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { useEffect } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"

interface EditETFPensionPageProps {
  params: {
    id: string
  }
}

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { selectedPension, fetchPension, updateEtfPension } = usePension()
  const pensionId = parseInt(params.id)

  const form = useForm<ETFPensionFormData>({
    defaultValues: {
      type: PensionType.ETF_PLAN,
      name: "",
      member_id: "",
      etf_id: "",
      is_existing_investment: false,
      existing_units: 0,
      reference_date: new Date(),
      realize_historical_contributions: false,
      initialization_method: "none",
      contribution_plan_steps: []
    }
  })

  useEffect(() => {
    fetchPension(pensionId)
  }, [fetchPension, pensionId])

  useEffect(() => {
    if (selectedPension && selectedPension.type === PensionType.ETF_PLAN) {
      form.reset({
        type: PensionType.ETF_PLAN,
        name: selectedPension.name,
        member_id: selectedPension.member_id.toString(),
        etf_id: selectedPension.etf_id,
        is_existing_investment: selectedPension.is_existing_investment,
        existing_units: selectedPension.existing_units || 0,
        reference_date: selectedPension.reference_date || new Date(),
        realize_historical_contributions: selectedPension.realize_historical_contributions || false,
        initialization_method: "none",
        contribution_plan_steps: selectedPension.contribution_plan_steps.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        }))
      })
    }
  }, [selectedPension, form])

  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await updateEtfPension(pensionId, {
        type: PensionType.ETF_PLAN,
        name: data.name,
        member_id: memberId,
        etf_id: data.etf_id,
        is_existing_investment: data.is_existing_investment,
        existing_units: data.existing_units,
        reference_date: data.reference_date,
        contribution_plan_steps: data.contribution_plan_steps,
        realize_historical_contributions: data.initialization_method === "historical"
      })

      toast.success("Success", { description: "ETF pension updated successfully" })
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
          <h1 className="text-3xl font-bold tracking-tight">Edit ETF Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Update your ETF-based pension plan details and contribution schedule.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <EditETFPensionForm form={form} />
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