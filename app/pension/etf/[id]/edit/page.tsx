"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditETFPensionBasicInformationForm } from "@/frontend/components/pension/form/EditETFPensionBasicInformationForm"
import { EditETFPensionContributionPlanForm } from "@/frontend/components/pension/form/EditETFPensionContributionPlanForm"
import { ETFPensionStats } from "@/frontend/components/pension/ETFPensionStats"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, type ETFPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { use } from "react"

interface EditETFPensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { selectedPension, fetchPension, updateEtfPension, isLoading } = usePension()
  const [hasFetched, setHasFetched] = useState(false)
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)

  const form = useForm<ETFPensionFormData>({
    defaultValues: {
      type: PensionType.ETF_PLAN,
      name: "",
      member_id: "",
      notes: "",
      etf_id: "",
      is_existing_investment: false,
      existing_units: 0,
      reference_date: new Date(),
      realize_historical_contributions: false,
      initialization_method: "none",
      contribution_plan_steps: []
    }
  })

  // Only fetch pension once when component mounts
  useEffect(() => {
    if (!hasFetched) {
      fetchPension(pensionId)
      setHasFetched(true)
    }
  }, [fetchPension, pensionId, hasFetched])

  // Update form when pension data changes
  useEffect(() => {
    if (selectedPension && selectedPension.type === PensionType.ETF_PLAN) {
      form.reset({
        type: PensionType.ETF_PLAN,
        name: selectedPension.name,
        member_id: selectedPension.member_id.toString(),
        notes: selectedPension.notes,
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
          end_date: step.end_date ? new Date(step.end_date) : undefined,
          note: step.note
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

      if (!selectedPension || selectedPension.type !== PensionType.ETF_PLAN) {
        toast.error("Error", { description: "ETF Pension not found" })
        return
      }

      // Transform contribution steps to ensure all fields are properly included
      const contribution_plan_steps = data.contribution_plan_steps.map(step => ({
        amount: step.amount,
        frequency: step.frequency,
        start_date: step.start_date,
        end_date: step.end_date || undefined,
        note: step.note || undefined
      }))

      const payload = {
        type: PensionType.ETF_PLAN as const,
        name: data.name,
        member_id: memberId,
        notes: data.notes,
        etf_id: data.etf_id,
        is_existing_investment: data.is_existing_investment,
        existing_units: data.existing_units,
        reference_date: data.reference_date,
        contribution_plan_steps,
        realize_historical_contributions: data.initialization_method === "historical",
        total_units: (selectedPension as ETFPension).total_units,
        status: selectedPension.status,
        paused_at: selectedPension.paused_at,
        resume_at: selectedPension.resume_at
      }

      await updateEtfPension(pensionId, payload)

      toast.success("Success", { description: "ETF pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to update pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit ETF Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your ETF-based pension plan details and contribution schedule.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="etf-pension-form"
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Main Content */}
            <div className="space-y-6">
              {/* First Row: Basic Information and Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <EditETFPensionBasicInformationForm form={form} />
                  )}
                </div>
                <div className="lg:col-span-5">
                  <ETFPensionStats pensionId={pensionId} />
                </div>
              </div>

              {/* Second Row: Contribution Plan and Historical Contributions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <EditETFPensionContributionPlanForm form={form} />
                  )}
                </div>
                <div className="lg:col-span-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>Historical Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-[200px] w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* TODO: Add ContributionHistoryChart */}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Third Row: Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-[200px] w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* TODO: Add performance charts */}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 