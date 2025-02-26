"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditETFPensionBasicInformationForm } from "@/frontend/components/pension/form/EditETFPensionBasicInformationForm"
import { EditETFPensionContributionStepsForm } from "@/frontend/components/pension/form/EditETFPensionContributionStepsForm"
import { ETFPensionStats } from "@/frontend/components/pension/ETFPensionStats"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, type ETFPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { toast } from "sonner"
import { use } from "react"
import { useEffect, useState } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { CombinedProjectionChart } from "@/frontend/components/charts"
import { ProjectionScenarioKPIs } from "@/frontend/components/pension/ProjectionScenarioKPIs"
import { ProjectionExplanations } from "@/frontend/components/pension/ProjectionExplanations"
import { ContributionImpactAnalysis } from "@/frontend/components/pension/ContributionImpactAnalysis"
interface EditETFPensionPageProps {
  params: Promise<{
    id: string
  }>
}

// Form transformation utilities
const transformPensionToFormData = (pension: ETFPension): ETFPensionFormData => ({
  type: PensionType.ETF_PLAN,
  name: pension.name,
  member_id: pension.member_id.toString(),
  notes: pension.notes,
  etf_id: pension.etf_id,
  is_existing_investment: pension.is_existing_investment,
  existing_units: pension.existing_units || 0,
  reference_date: pension.reference_date || new Date(),
  realize_historical_contributions: pension.realize_historical_contributions || false,
  initialization_method: pension.realize_historical_contributions ? "historical" : "none",
  contribution_plan_steps: pension.contribution_plan_steps.map(step => ({
    amount: step.amount,
    frequency: step.frequency,
    start_date: new Date(step.start_date),
    end_date: step.end_date ? new Date(step.end_date) : undefined,
    note: step.note
  }))
})

const transformFormDataToPension = (data: ETFPensionFormData, currentPension: ETFPension): Omit<ETFPension, "id" | "current_value"> => ({
  type: PensionType.ETF_PLAN,
  name: data.name,
  member_id: parseInt(data.member_id),
  notes: data.notes,
  etf_id: data.etf_id,
  is_existing_investment: data.is_existing_investment,
  existing_units: data.existing_units,
  reference_date: data.reference_date,
  contribution_plan_steps: data.contribution_plan_steps.map(step => ({
    amount: step.amount,
    frequency: step.frequency,
    start_date: step.start_date,
    end_date: step.end_date || undefined,
    note: step.note || undefined
  })),
  realize_historical_contributions: data.initialization_method === "historical",
  total_units: currentPension.total_units,
  status: currentPension.status,
  paused_at: currentPension.paused_at,
  resume_at: currentPension.resume_at
})

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { 
    selectedPension: pension, 
    fetchPension, 
    updateEtfPension, 
    pensionStatistics,
    isLoadingStatistics,
    fetchPensionStatistics
  } = usePension()
  const { members, fetchMembers } = useHousehold()
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const statistics = pensionStatistics[pensionId]

  // Get the member's retirement date
  const member = pension ? members.find(m => m.id === pension.member_id) : null
  const retirementDate = member ? new Date(member.retirement_date_planned) : undefined

  // Unified loading state
  const loadingState = {
    isPageLoading: isInitialLoading,
    isStatisticsLoading: isLoadingStatistics[pensionId] || false,
    isAnyLoading: isInitialLoading || isLoadingStatistics[pensionId] || false
  }

  // Unified error handler
  const handleError = (error: unknown, action: string) => {
    console.error(`Failed to ${action}:`, error)
    toast.error("Error", { 
      description: `Failed to ${action}. Please try again.`
    })
    setIsInitialLoading(false) // Ensure we exit loading state on error
  }

  // Combined data fetching effect
  useEffect(() => {
    if (!pensionId) return

    const loadData = async () => {
      try {
        setIsInitialLoading(true)
        await Promise.all([
          fetchPension(pensionId),
          fetchMembers(),
          fetchPensionStatistics(pensionId)
        ])
      } catch (error) {
        handleError(error, "load pension data")
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadData()
  }, [pensionId]) // Only depend on pensionId to prevent unnecessary refetches

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

  // Update form when pension data changes
  useEffect(() => {
    if (pension && pension.type === PensionType.ETF_PLAN) {
      form.reset(transformPensionToFormData(pension))
    }
  }, [pension, form])

  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      if (!pension || pension.type !== PensionType.ETF_PLAN) {
        toast.error("Error", { description: "ETF Pension not found" })
        return
      }

      const payload = transformFormDataToPension(data, pension)
      await updateEtfPension(pensionId, payload)

      toast.success("Success", { description: "ETF pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      handleError(error, "update pension")
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
              disabled={loadingState.isAnyLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-6">
              {/* Basic Information and Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  {loadingState.isPageLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <EditETFPensionBasicInformationForm form={form} />
                  )}
                </div>
                <div className="lg:col-span-4">
                  <ETFPensionStats pensionId={pensionId} />
                </div>
              </div>

              {/* Contribution Plan and History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  {loadingState.isPageLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <EditETFPensionContributionStepsForm form={form} />
                  )}
                </div>
                {/* Right side with dynamic analysis */}
                <div className="lg:col-span-4 space-y-6">
                  <ContributionImpactAnalysis 
                    form={form}
                    retirementDate={retirementDate}
                  />
                </div>
              </div>

              {/* Value Development and Projections */}
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left column (8) - Chart */}
                  <div className="lg:col-span-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Value Projection</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingState.isStatisticsLoading ? (
                          <Skeleton className="h-[400px] w-full" />
                        ) : statistics?.value_history ? (
                          <CombinedProjectionChart
                            data={statistics.value_history.map(point => ({
                              date: new Date(point.date),
                              value: parseFloat(point.value.toString()),
                              isProjection: false
                            }))}
                            contributionData={statistics.contribution_history}
                            timeRange={{
                              start: new Date(statistics.value_history[0].date),
                              end: retirementDate || new Date()
                            }}
                            height={600}
                          />
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right column (4) - KPIs and Explanations */}
                  <div className="lg:col-span-4 space-y-6">
                    {!loadingState.isStatisticsLoading && statistics?.scenarios && (
                      <ProjectionScenarioKPIs
                        scenarios={statistics.scenarios}
                        totalContributions={statistics.total_invested_amount}
                      />
                    )}
                    <ProjectionExplanations />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 